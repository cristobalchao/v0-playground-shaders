"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import vertexShader from "@/shaders/art/vertex.glsl";
import fragmentShader from "@/shaders/art/fragment.glsl";

type ShaderUniforms = {
  uIterations: number;
  uAmplitude: number;
  uFreq: number;
};

type ShaderArtProps = {
  uniforms: ShaderUniforms;
};

export default function ShaderArt({ uniforms }: ShaderArtProps) {
  const shaderUniforms = useRef({
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3(1, 1, 1) },
    uIterations: { value: uniforms.uIterations },
    uAmplitude: { value: uniforms.uAmplitude },
    uFreq: { value: uniforms.uFreq },
  });

  useEffect(() => {
    shaderUniforms.current.uIterations.value = Math.max(
      1.0,
      uniforms.uIterations
    );
    shaderUniforms.current.uAmplitude.value = uniforms.uAmplitude;
    shaderUniforms.current.uFreq.value = uniforms.uFreq;
  }, [uniforms.uAmplitude, uniforms.uFreq, uniforms.uIterations]);

  useFrame((state, delta) => {
    shaderUniforms.current.iTime.value += delta;
    shaderUniforms.current.iResolution.value.set(
      state.size.width,
      state.size.height,
      1
    );
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={shaderUniforms.current}
      />
    </mesh>
  );
}

export type ShaderArtUniforms = ShaderUniforms;
