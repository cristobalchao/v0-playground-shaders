"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Playground, useControls } from "@toriistudio/v0-playground";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";

const CONTROL_SCHEMA = {
  intensity: {
    type: "number" as const,
    value: 0.85,
    min: 0,
    max: 2,
    step: 0.05,
  },
  zoom: {
    type: "number" as const,
    value: 1.2,
    min: 0.5,
    max: 2.5,
    step: 0.05,
  },
  speed: {
    type: "number" as const,
    value: 0.9,
    min: 0,
    max: 3,
    step: 0.05,
  },
  clear: {
    type: "boolean" as const,
    value: true,
  },
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

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / max(uResolution.y, 1.0);
  uv *= uZoom;

  float t = uTime * uSpeed;
  float rings = sin(length(uv) * 8.0 - t * 1.5);
  float waves = sin((uv.x + uv.y) * 6.0 + t * 0.9);
  float glow = smoothstep(0.0, 1.0, rings * 0.5 + 0.5);

  vec3 base = mix(vec3(0.05, 0.1, 0.2), vec3(0.35, 0.8, 0.9), glow);
  vec3 color = base + waves * 0.12;
  color *= uIntensity;

  FragColor = vec4(color, 1.0);
}
`;

function ShaderScene() {
  const controls = useControls(CONTROL_SCHEMA, {
    componentName: "ShaderPass",
    config: {
      mainLabel: "Shader Pass Controls",
      showGrid: false,
      showCopyButton: false,
      showCodeSnippet: true,
    },
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uIntensity: { value: CONTROL_SCHEMA.intensity.value },
      uZoom: { value: CONTROL_SCHEMA.zoom.value },
      uSpeed: { value: CONTROL_SCHEMA.speed.value },
    }),
    [],
  );

  uniforms.uIntensity.value =
    controls.intensity ?? CONTROL_SCHEMA.intensity.value;
  uniforms.uZoom.value = controls.zoom ?? CONTROL_SCHEMA.zoom.value;
  uniforms.uSpeed.value = controls.speed ?? CONTROL_SCHEMA.speed.value;

  return (
    <ShaderPass
      vertexShader={VERTEX_SHADER}
      fragmentShader={FRAGMENT_SHADER}
      uniforms={uniforms}
      clear={controls.clear ?? CONTROL_SCHEMA.clear.value}
      clearColor={0x060b14}
      timeUniform="uTime"
      resolutionUniform="uResolution"
      priority={1}
    />
  );
}

export default function ShaderPassPage() {
  return (
    <Playground>
      <Canvas>
        <ShaderScene />
      </Canvas>
    </Playground>
  );
}
