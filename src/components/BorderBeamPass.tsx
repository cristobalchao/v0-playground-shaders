"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import ShaderPass from "@/components/ShaderPass";

export type BorderBeamPassUniforms = {
  /** Border thickness in UV space (Unicorn-ish: 0.02 for inner, 0.08 for outer) */
  thickness: number;
  /** Multiplier on the glow */
  intensity: number;
  /** RGB beam color */
  color: [number, number, number];
  /** Add tiny dithering noise */
  dither: boolean;
  /** Dither strength (default: 1/128) */
  ditherStrength: number;
  /** Apply tanh tonemap (matches Unicorn) */
  tonemap: boolean;
  /** Alpha multiplier (lets you control contribution later) */
  alpha: number;
};

type BorderBeamPassProps = {
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  clearColor?: THREE.ColorRepresentation;
  enabled?: boolean;
  priority?: number;
  uniforms?: Partial<BorderBeamPassUniforms>;
};

const DEFAULTS: BorderBeamPassUniforms = {
  thickness: 0.02,
  intensity: 1.0,
  color: [0.2705882353, 0.6039215686, 1.0],
  dither: true,
  ditherStrength: 1 / 128,
  tonemap: true,
  alpha: 1.0,
};

const VERT = `
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
precision highp float;
precision highp int;

in vec2 vUv;

uniform float uThickness;
uniform float uIntensity;
uniform vec3 uColor;
uniform float uAlpha;
uniform int uUseDither;
uniform float uDitherStrength;
uniform int uUseTonemap;

out vec4 fragColor;

// PCG-ish hash, similar spirit to Unicorn's randFibo usage
uvec2 pcg2d(uvec2 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  v ^= v >> 16u;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  return v;
}

float rand01(vec2 p) {
  uvec2 v = floatBitsToUint(p);
  v = pcg2d(v);
  uint r = v.x ^ v.y;
  return float(r) / float(0xffffffffu);
}

vec3 tonemapTanh(vec3 x) {
  x = clamp(x, -40.0, 40.0);
  return (exp(x) - exp(-x)) / (exp(x) + exp(-x));
}

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 drawViewportEdges(vec2 uv) {
  float distToEdge = min(min(uv.x, uv.y), min(1.0 - uv.x, 1.0 - uv.y));
  float sdf = distToEdge;

  // Unicorn formula:
  // glow = glowThickness / (1.0 - smoothstep(0.12, 0.01, abs(sdf) + 0.02));
  float glow = uThickness / (1.0 - smoothstep(0.12, 0.01, abs(sdf) + 0.02));

  vec3 beam = glow * pow(1.0 - abs(sdf), 3.0) * uColor;
  return beam * uIntensity;
}

void main() {
  vec2 uv = vUv;

  vec3 beam = drawViewportEdges(uv);
  if (uUseTonemap == 1) {
    beam = tonemapTanh(beam);
  }

  // We render just the beam. Composition happens in later passes.
  // Alpha in Unicorn was max(bg.a, luma(beam)); here we output beam-only alpha.
  float a = clamp(luma(beam) * uAlpha, 0.0, 1.0);

  // Tiny dither (like Unicorn /255.0)
  if (uUseDither == 1) {
    float d = (rand01(gl_FragCoord.xy) - 0.5) * uDitherStrength;
    beam += d;
  }

  fragColor = vec4(beam, a);
}
`;

export default function BorderBeamPass({
  target = null,
  clear = true,
  clearColor = 0x000000,
  enabled = true,
  priority = 0,
  uniforms: uniformsOverride = {},
}: BorderBeamPassProps) {
  const u = { ...DEFAULTS, ...uniformsOverride };

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uThickness: { value: u.thickness },
      uIntensity: { value: u.intensity },
      uColor: { value: new THREE.Color(u.color[0], u.color[1], u.color[2]) },
      uAlpha: { value: u.alpha },
      uUseDither: { value: u.dither ? 1 : 0 },
      uDitherStrength: { value: u.ditherStrength },
      uUseTonemap: { value: u.tonemap ? 1 : 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Keep uniforms in sync when props change (without recreating material)
  uniforms.uThickness.value = u.thickness;
  uniforms.uIntensity.value = u.intensity;
  (uniforms.uColor.value as THREE.Color).setRGB(
    u.color[0],
    u.color[1],
    u.color[2],
  );
  uniforms.uAlpha.value = u.alpha;
  uniforms.uUseDither.value = u.dither ? 1 : 0;
  uniforms.uDitherStrength.value = u.ditherStrength;
  uniforms.uUseTonemap.value = u.tonemap ? 1 : 0;

  return (
    <ShaderPass
      vertexShader={VERT}
      fragmentShader={FRAG}
      uniforms={uniforms}
      target={target}
      clear={clear}
      clearColor={clearColor}
      enabled={enabled}
      priority={priority}
      transparent
      // Generator pass: no input texture used.
      blending={THREE.NoBlending}
    />
  );
}
