"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Shader for the main effect combining border glow, rings, and dither
const GlowShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uAspect: { value: 1.6 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uAspect;
    
    varying vec2 vUv;
    
    const float PI = 3.14159265359;
    const float TWO_PI = 6.28318530718;
    
    // PCG Random
    uvec2 pcg2d(uvec2 v) {
      v = v * 1664525u + 1013904223u;
      v.x += v.y * v.y * 1664525u + 1013904223u;
      v.y += v.x * v.x * 1664525u + 1013904223u;
      v ^= v >> 16u;
      v.x += v.y * v.y * 1664525u + 1013904223u;
      v.y += v.x * v.x * 1664525u + 1013904223u;
      return v;
    }
    
    float rand(vec2 p) {
      uvec2 v = floatBitsToUint(p);
      v = pcg2d(v);
      uint r = v.x ^ v.y;
      return float(r) / float(0xffffffffu);
    }
    
    // Simple hash for dither pattern
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    
    // Ordered dither pattern (Bayer 4x4)
    float bayerDither(vec2 pos) {
      int x = int(mod(pos.x, 4.0));
      int y = int(mod(pos.y, 4.0));
      int index = x + y * 4;
      
      float pattern[16];
      pattern[0] = 0.0/16.0;  pattern[1] = 8.0/16.0;  pattern[2] = 2.0/16.0;  pattern[3] = 10.0/16.0;
      pattern[4] = 12.0/16.0; pattern[5] = 4.0/16.0;  pattern[6] = 14.0/16.0; pattern[7] = 6.0/16.0;
      pattern[8] = 3.0/16.0;  pattern[9] = 11.0/16.0; pattern[10] = 1.0/16.0; pattern[11] = 9.0/16.0;
      pattern[12] = 15.0/16.0; pattern[13] = 7.0/16.0; pattern[14] = 13.0/16.0; pattern[15] = 5.0/16.0;
      
      if (index == 0) return pattern[0];
      if (index == 1) return pattern[1];
      if (index == 2) return pattern[2];
      if (index == 3) return pattern[3];
      if (index == 4) return pattern[4];
      if (index == 5) return pattern[5];
      if (index == 6) return pattern[6];
      if (index == 7) return pattern[7];
      if (index == 8) return pattern[8];
      if (index == 9) return pattern[9];
      if (index == 10) return pattern[10];
      if (index == 11) return pattern[11];
      if (index == 12) return pattern[12];
      if (index == 13) return pattern[13];
      if (index == 14) return pattern[14];
      return pattern[15];
    }
    
    // Tanh tonemap
    vec3 tonemapTanh(vec3 x) {
      x = clamp(x, -40.0, 40.0);
      return (exp(x) - exp(-x)) / (exp(x) + exp(-x));
    }
    
    // Border glow effect
    vec3 drawBorderGlow(vec2 uv, float thickness, float intensity) {
      float distToEdge = min(min(uv.x, uv.y), min(1.0 - uv.x, 1.0 - uv.y));
      float glow = thickness / (1.0 - smoothstep(0.12, 0.01, abs(distToEdge) + 0.02));
      return glow * pow(1.0 - abs(distToEdge), 3.0) * vec3(0.27, 0.604, 1.0) * intensity;
    }
    
    // Expanding ring effect
    vec3 drawExpandingRing(vec2 uv, vec2 center, float time) {
      float aspectRatio = uAspect;
      vec2 uvCorrected = uv * vec2(aspectRatio, 1.0);
      vec2 centerCorrected = center * vec2(aspectRatio, 1.0);
      
      float modulo = fract(time * 0.02);
      float ringRadius = 1.1 * modulo;
      float distFromCenter = length(uvCorrected - centerCorrected);
      float ringDist = abs(distFromCenter - ringRadius);
      
      float lineRadius = 0.5 * modulo;
      float brightness = lineRadius / (1.0 - smoothstep(0.2, 0.002, ringDist + 0.02));
      brightness = brightness * max(0.0, 1.0 - modulo);
      
      vec3 ringColor = brightness * pow(1.0 - ringDist, 3.0) * vec3(0.0, 0.506, 0.969);
      return ringColor;
    }
    
    // Simplex-like noise for subtle distortion
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    void main() {
      vec2 uv = vUv;
      vec2 pixelCoord = uv * uResolution;
      
      // Apply subtle noise distortion
      float noiseScale = 12.0;
      float noiseTime = uTime * 0.02;
      vec2 noiseUV = uv * noiseScale + vec2(0.0, noiseTime * 0.36);
      float n = noise(noiseUV);
      vec2 distortedUV = uv + (n - 0.5) * 0.01;
      
      // Base dark background
      vec3 color = vec3(0.0);
      
      // Inner border glow (sharp)
      vec3 innerBorder = drawBorderGlow(distortedUV, 0.02, 1.0);
      
      // Outer border glow (softer, wider)
      vec3 outerBorder = drawBorderGlow(distortedUV, 0.08, 0.6);
      
      // Expanding ring from center
      vec3 ring = drawExpandingRing(distortedUV, vec2(0.5, 0.5), uTime);
      
      // Combine effects
      vec3 glow = innerBorder + outerBorder + ring;
      glow = tonemapTanh(glow);
      
      // Apply difference blend mode approximation
      color = abs(color - glow);
      
      // Add subtle background tint near edges
      float edgeDist = min(min(uv.x, uv.y), min(1.0 - uv.x, 1.0 - uv.y));
      color += vec3(0.0, 0.05, 0.1) * (1.0 - smoothstep(0.0, 0.3, edgeDist)) * 0.3;
      
      // Dither effect
      float ditherSize = 4.0;
      vec2 ditherCoord = floor(pixelCoord / ditherSize);
      float dither = bayerDither(ditherCoord);
      
      // Apply dither to create halftone effect
      float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
      float gamma = pow(0.58, 2.2);
      float threshold = dither * 0.5;
      
      // Blend dithered version
      vec3 dithered = color;
      dithered = mix(dithered * 0.5, dithered * 1.4, step(threshold, luminance + 0.1));
      color = mix(color, dithered, 0.5);
      
      // Add subtle noise dither to reduce banding
      float noiseDither = (rand(gl_FragCoord.xy) - 0.5) / 255.0;
      color += noiseDither;
      
      // Final alpha based on glow intensity
      float alpha = max(0.1, length(glow) * 0.5 + 0.5);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

function GlowingFrameEffect() {
  const meshRef = useRef();
  const { viewport, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uAspect: { value: size.width / size.height },
    }),
    [],
  );

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
      meshRef.current.material.uniforms.uResolution.value.set(
        size.width,
        size.height,
      );
      meshRef.current.material.uniforms.uAspect.value =
        size.width / size.height;
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={GlowShaderMaterial.vertexShader}
        fragmentShader={GlowShaderMaterial.fragmentShader}
        transparent={true}
      />
    </mesh>
  );
}

export default function GlowingFrame() {
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, 2));
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#000" }}>
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        gl={{ antialias: true, alpha: false }}
        dpr={dpr}
      >
        <color attach="background" args={["#000000"]} />
        <GlowingFrameEffect />
      </Canvas>
    </div>
  );
}
