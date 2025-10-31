"use client";

import { Canvas } from "@react-three/fiber";
import { Playground, useControls } from "@toriistudio/v0-playground";

import ShaderArt, { type ShaderArtUniforms } from "@/components/ShaderArt";

const CONTROL_SCHEMA = {
  uIterations: {
    type: "number" as const,
    value: 4,
    min: 1,
    max: 8,
    step: 1,
  },
  uAmplitude: {
    type: "number" as const,
    value: 1.5,
    min: 0.5,
    max: 3,
    step: 0.1,
  },
  uFreq: {
    type: "number" as const,
    value: 0.4,
    min: 0.05,
    max: 2,
    step: 0.05,
  },
};

function ShaderScene() {
  const controls = useControls(CONTROL_SCHEMA, {
    componentName: "ShaderArt",
    config: {
      mainLabel: "Shader Art Controls",
      showGrid: false,
      showCopyButton: false,
      showCodeSnippet: true,
    },
  });

  const uniforms: ShaderArtUniforms = {
    uIterations: Math.max(
      1,
      Math.round(controls.uIterations ?? CONTROL_SCHEMA.uIterations.value)
    ),
    uAmplitude: controls.uAmplitude ?? CONTROL_SCHEMA.uAmplitude.value,
    uFreq: controls.uFreq ?? CONTROL_SCHEMA.uFreq.value,
  };

  return <ShaderArt uniforms={uniforms} />;
}

export default function Home() {
  return (
    <Playground>
      <Canvas>
        <ShaderScene />
      </Canvas>
    </Playground>
  );
}
