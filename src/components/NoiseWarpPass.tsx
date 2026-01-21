"use client";

import { useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import useMouse from "@/hooks/useMouse";

export type NoiseWarpPassUniforms = {
  trackMouse: boolean;
  strength: number;
  radius: number;
};

type NoiseWarpPassProps = {
  inputTexture?: THREE.Texture | null;
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  clearColor?: THREE.ColorRepresentation;
  enabled?: boolean;
  priority?: number;
  uniforms?: Partial<NoiseWarpPassUniforms>;
};

const DEFAULTS: NoiseWarpPassUniforms = {
  trackMouse: true,
  strength: 0.2,
  radius: 0.5,
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

in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uStrength;
uniform float uRadius;
uniform vec2 uMousePos;
uniform vec2 uResolution;

float ease (int easingFunc, float t) { return t; }
vec4 permute(vec4 t) { return t * (t * 34.0 + 133.0); }
vec3 grad(float hash) {
  vec3 cube = mod(floor(hash / vec3(1.0, 2.0, 4.0)), 2.0) * 2.0 - 1.0;
  vec3 cuboct = cube;
  float index0 = step(0.0, 1.0 - floor(hash / 16.0));
  float index1 = step(0.0, floor(hash / 16.0) - 1.0);
  cuboct.x *= 1.0 - index0;
  cuboct.y *= 1.0 - index1;
  cuboct.z *= 1.0 - (1.0 - index0 - index1);
  float type = mod(floor(hash / 8.0), 2.0);
  vec3 rhomb = (1.0 - type) * cube + type * (cuboct + cross(cube, cuboct));
  vec3 grad = cuboct * 1.22474487139 + rhomb;
  grad *= (1.0 - 0.042942436724648037 * type) * 3.5946317686139184;
  return grad;
}
vec4 bccNoiseDerivativesPart(vec3 X) {
  vec3 b = floor(X);
  vec4 i4 = vec4(X - b, 2.5);
  vec3 v1 = b + floor(dot(i4, vec4(.25)));
  vec3 v2 = b + vec3(1, 0, 0) + vec3(-1, 1, 1) * floor(dot(i4, vec4(-.25, .25, .25, .35)));
  vec3 v3 = b + vec3(0, 1, 0) + vec3(1, -1, 1) * floor(dot(i4, vec4(.25, -.25, .25, .35)));
  vec3 v4 = b + vec3(0, 0, 1) + vec3(1, 1, -1) * floor(dot(i4, vec4(.25, .25, -.25, .35)));
  vec4 hashes = permute(mod(vec4(v1.x, v2.x, v3.x, v4.x), 289.0));
  hashes = permute(mod(hashes + vec4(v1.y, v2.y, v3.y, v4.y), 289.0));
  hashes = mod(permute(mod(hashes + vec4(v1.z, v2.z, v3.z, v4.z), 289.0)), 48.0);
  vec3 d1 = X - v1;
  vec3 d2 = X - v2;
  vec3 d3 = X - v3;
  vec3 d4 = X - v4;
  vec4 a = max(0.75 - vec4(dot(d1, d1), dot(d2, d2), dot(d3, d3), dot(d4, d4)), 0.0);
  vec4 aa = a * a;
  vec4 aaaa = aa * aa;
  vec3 g1 = grad(hashes.x);
  vec3 g2 = grad(hashes.y);
  vec3 g3 = grad(hashes.z);
  vec3 g4 = grad(hashes.w);
  vec4 extrapolations = vec4(dot(d1, g1), dot(d2, g2), dot(d3, g3), dot(d4, g4));
  vec3 derivative = -8.0 * mat4x3(d1, d2, d3, d4) * (aa * a * extrapolations) + mat4x3(g1, g2, g3, g4) * aaaa;
  return vec4(derivative, dot(aaaa, extrapolations));
}
vec4 bccNoiseDerivatives_XYBeforeZ(vec3 X) {
  mat3 orthonormalMap = mat3(
    0.788675134594813, -0.211324865405187, -0.577350269189626,
    -0.211324865405187, 0.788675134594813, -0.577350269189626,
    0.577350269189626, 0.577350269189626, 0.577350269189626
  );
  X = orthonormalMap * X;
  vec4 result = bccNoiseDerivativesPart(X) + bccNoiseDerivativesPart(X + 144.5);
  return vec4(result.xyz * orthonormalMap, result.w);
}

out vec4 fragColor;

const float PI = 3.14159265359;

mat2 rot(float a) {
  return mat2(cos(a), -sin(a), sin(a), cos(a));
}

vec2 get2sNoise(vec2 uv, vec2 textureCoord) {
  vec4 noise = bccNoiseDerivatives_XYBeforeZ(
    vec3(uv * vec2(0.5000, 1.0 - 0.5000) * 0.7, 0.0000 + uTime * 0.02)
  );
  vec2 offset = noise.xy / 7.0 + 0.5;
  return mix(textureCoord, offset, uStrength);
}

vec2 getNoiseOffset(vec2 uv, vec2 textureCoord) {
  return get2sNoise(uv, textureCoord);
}

void main() {
  vec2 uv = vTextureCoord;
  float aspectRatio = uResolution.x / uResolution.y;

  vec2 mPos = uMousePos;
  vec2 pos = mPos;
  vec2 drift = vec2(0.0, 0.3600 * uTime * 0.0125);
  pos += drift * rot(0.0000 * -2.0 * PI);

  vec2 st = (uv - pos) * vec2(aspectRatio, 1.0);
  st *= 12.0 * 1.0000;
  st = rot(0.0000 * -2.0 * PI) * st;

  vec2 noise = getNoiseOffset(st, uv);

  float radius = mix(0.0001, 1.5, clamp(uRadius, 0.0, 1.0));
  float dist = ease(
    0,
    max(
      0.0,
      1.0 - distance(uv * vec2(aspectRatio, 1.0), mPos * vec2(aspectRatio, 1.0)) / radius
    )
  );
  if (0 == 1) {
    dist = max(0.0, (0.5 - dist));
  }
  uv = mix(uv, noise, dist);

  vec4 color = texture(uTexture, uv);
  fragColor = color;
}
`;

export default function NoiseWarpPass({
  inputTexture = null,
  target = null,
  clear = false,
  clearColor = 0x000000,
  enabled = true,
  priority = 0,
  uniforms: uniformsOverride = {},
}: NoiseWarpPassProps) {
  const u = { ...DEFAULTS, ...uniformsOverride };
  const mousePos = useMouse({ enabled: u.trackMouse });

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTexture: { value: inputTexture },
      uTextureMatrix: { value: new THREE.Matrix4() },
      uTime: { value: 0 },
      uStrength: { value: u.strength },
      uRadius: { value: u.radius },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMousePos: { value: mousePos },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTexture.value = inputTexture;
  uniforms.uMousePos.value = mousePos;
  uniforms.uStrength.value = u.strength;
  uniforms.uRadius.value = u.radius;

  return (
    <ShaderPass
      vertexShader={VERT}
      fragmentShader={FRAG}
      uniforms={uniforms}
      inputTexture={inputTexture}
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
