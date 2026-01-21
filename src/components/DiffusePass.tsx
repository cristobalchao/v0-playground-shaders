"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import useMouse from "@/hooks/useMouse";

export type DiffusePassUniforms = {
  trackMouse: boolean;
  diffuseRadius: number;
};

type DiffusePassProps = {
  inputTexture?: THREE.Texture | null;
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  clearColor?: THREE.ColorRepresentation;
  enabled?: boolean;
  priority?: number;
  uniforms?: Partial<DiffusePassUniforms>;
};

const DEFAULTS: DiffusePassUniforms = {
  trackMouse: true,
  diffuseRadius: 0.5,
};

const VERT = `
out vec2 vTextureCoord;

uniform mat4 uTextureMatrix;

void main() {
  vTextureCoord = (uTextureMatrix * vec4(uv, 0.0, 1.0)).xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
precision highp float;
precision highp int;

in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uDiffuseRadius;
uniform vec2 uMousePos;
uniform vec2 uResolution;

float ease (int easingFunc, float t) { return t; }
uvec2 pcg2d(uvec2 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  v ^= v >> 16;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  return v;
}
float randFibo(vec2 p) {
  uvec2 v = floatBitsToUint(p);
  v = pcg2d(v);
  uint r = v.x ^ v.y;
  return float(r) / float(0xffffffffu);
}

const float MAX_ITERATIONS = 24.0;
const float PI = 3.14159265;
const float TWOPI = 6.2831853;

out vec4 fragColor;

void main() {
  vec2 uv = vTextureCoord;
  vec2 pos = vec2(0.5, 0.5) + mix(vec2(0.0), (uMousePos - 0.5), 0.0000);
  float aspectRatio = uResolution.x / uResolution.y;
  float delta = fract(floor(uTime) / 20.0);
  float angle, rotation, amp;
  float inner = distance(uv * vec2(aspectRatio, 1.0), pos * vec2(aspectRatio, 1.0));
  float outer = max(0.0, 1.0 - distance(uv * vec2(aspectRatio, 1.0), pos * vec2(aspectRatio, 1.0)));
  float amount = 0.0900 * 2.0;

  vec2 mPos = vec2(0.5, 0.5) + mix(vec2(0.0), (uMousePos - 0.5), 0.0000);
  pos = vec2(0.5, 0.5);
  float radius = max(uDiffuseRadius, 0.0);
  radius = mix(0.0001, 1.5, clamp(radius, 0.0, 1.0));
  float dist = ease(0, max(0.0, 1.0 - distance(uv * vec2(aspectRatio, 1.0), mPos * vec2(aspectRatio, 1.0)) / radius));
  amount *= dist;

  vec4 col;
  if (amount <= 0.001) {
    col = texture(uTexture, uv);
  } else {
    vec4 result = vec4(0.0);
    float threshold = max(1.0 - 0.0000, 2.0 / MAX_ITERATIONS);
    const float invMaxIterations = 1.0 / float(MAX_ITERATIONS);
    vec2 dir = vec2(0.5000 / aspectRatio, 1.0 - 0.5000) * amount * 0.4;
    float iterations = 0.0;
    for (float i = 1.0; i <= MAX_ITERATIONS; i++) {
      float th = i * invMaxIterations;
      if (th > threshold) break;
      float random1 = randFibo(uv + th + delta);
      float random2 = randFibo(uv + th * 2.0 + delta);
      float random3 = randFibo(uv + th * 3.0 + delta);
      vec2 ranPoint = vec2(random1 * 2.0 - 1.0, random2 * 2.0 - 1.0) * mix(1.0, random3, 0.8);
      result += texture(uTexture, uv + ranPoint * dir);
      iterations += 1.0;
    }
    result /= max(1.0, iterations);
    col = result;
  }
  fragColor = col;
}
`;

export default function DiffusePass({
  inputTexture = null,
  target = null,
  clear = false,
  clearColor = 0x000000,
  enabled = true,
  priority = 0,
  uniforms: uniformsOverride = {},
}: DiffusePassProps) {
  const u = { ...DEFAULTS, ...uniformsOverride };
  const mousePos = useMouse({ enabled: u.trackMouse });
  const fallbackTexture = useMemo(() => {
    const data = new Uint8Array([0, 0, 0, 255]);
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => {
    if (!inputTexture) {
      console.warn("DiffusePass: inputTexture is required.");
    }
  }, [inputTexture]);

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTexture: { value: inputTexture ?? fallbackTexture },
      uTextureMatrix: { value: new THREE.Matrix4() },
      uTime: { value: 0 },
      uDiffuseRadius: { value: u.diffuseRadius },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMousePos: { value: mousePos },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTexture.value = inputTexture ?? fallbackTexture;
  uniforms.uMousePos.value = mousePos;
  uniforms.uDiffuseRadius.value = u.diffuseRadius;

  return (
    <ShaderPass
      vertexShader={VERT}
      fragmentShader={FRAG}
      uniforms={uniforms}
      inputTexture={inputTexture ?? fallbackTexture}
      target={target}
      clear={clear}
      clearColor={clearColor}
      enabled={enabled}
      priority={priority}
      timeUniform="uTime"
      resolutionUniform="uResolution"
      blending={THREE.NoBlending}
    />
  );
}
