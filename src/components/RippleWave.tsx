"use client";

import { useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";

type RippleWaveProps = {
  width?: string | number;
  height?: string | number;
  intensity?: number;
  zoom?: number;
  speed?: number;
  hexColors?: string[];
};

const VERTEX_SHADER = /* glsl */ `
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

in vec2 vUv;
out vec4 FragColor;

uniform float uTime;
uniform vec2 uResolution;
uniform float uIntensity;
uniform float uZoom;
uniform float uSpeed;
uniform vec3 uPaletteA;
uniform vec3 uPaletteB;
uniform int uHasPalette;

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / max(uResolution.y, 1.0);
  uv *= uZoom;

  float t = uTime * uSpeed;
  float rings = sin(length(uv) * 8.0 - t * 1.5);
  float waves = sin((uv.x + uv.y) * 6.0 + t * 0.9);
  float glow = smoothstep(0.0, 1.0, rings * 0.5 + 0.5);

  vec3 base = mix(vec3(0.05, 0.1, 0.2), vec3(0.35, 0.8, 0.9), glow);
  if (uHasPalette == 1) {
    base = mix(uPaletteA, uPaletteB, glow);
  }
  vec3 color = base + waves * 0.12;
  color *= uIntensity;

  FragColor = vec4(color, 1.0);
}
`;

export default function RippleWave({
  intensity = 0.85,
  zoom = 1.2,
  speed = 0.9,
  hexColors,
}: RippleWaveProps) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uIntensity: { value: intensity },
      uZoom: { value: zoom },
      uSpeed: { value: speed },
      uPaletteA: { value: new THREE.Color(0, 0, 0) },
      uPaletteB: { value: new THREE.Color(0, 0, 0) },
      uHasPalette: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uIntensity.value = intensity;
  uniforms.uZoom.value = zoom;
  uniforms.uSpeed.value = speed;

  const mixedPalette = useMemo(() => {
    if (!hexColors?.length) return null;
    const midpoint = Math.ceil(hexColors.length / 2);
    const firstHalf = hexColors.slice(0, midpoint);
    const secondHalf = hexColors.slice(midpoint);

    const average = (colors: string[]) => {
      if (!colors.length) return new THREE.Color(0, 0, 0);
      const mixed = new THREE.Color(0, 0, 0);
      colors.forEach((hex) => {
        const c = new THREE.Color(hex);
        mixed.r += c.r;
        mixed.g += c.g;
        mixed.b += c.b;
      });
      mixed.r /= colors.length;
      mixed.g /= colors.length;
      mixed.b /= colors.length;
      return mixed;
    };

    return {
      a: average(firstHalf),
      b: average(secondHalf.length ? secondHalf : firstHalf),
    };
  }, [hexColors]);

  if (mixedPalette) {
    (uniforms.uPaletteA.value as THREE.Color).copy(mixedPalette.a);
    (uniforms.uPaletteB.value as THREE.Color).copy(mixedPalette.b);
    uniforms.uHasPalette.value = 1;
  } else {
    uniforms.uHasPalette.value = 0;
  }

  return (
    <ShaderPass
      vertexShader={VERTEX_SHADER}
      fragmentShader={FRAGMENT_SHADER}
      uniforms={uniforms}
      clearColor={0x060b14}
      timeUniform="uTime"
      resolutionUniform="uResolution"
      priority={1}
    />
  );
}
