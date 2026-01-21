"use client";

import { Canvas } from "@react-three/fiber";
import { Playground, useControls } from "@toriistudio/v0-playground";

import DitherPulseRing from "@/components/DitherPulseRing";

const BOLDER_FOLDER = "Border Settings";
const RING_FOLDER = "Ring Settings";
const DIFFUSE_FOLDER = "Diffuse Settings";
const BLUR_FOLDER = "Blur Settings";
const NOISE_FOLDER = "Noise Settings";
const CONTROL_SCHEMA = {
  color: {
    type: "color" as const,
    value: "#4599ff",
  },
  noiseWarpEnabled: {
    type: "boolean" as const,
    value: true,
    folder: NOISE_FOLDER,
  },
  noiseWarpStrength: {
    type: "number" as const,
    value: 0.1,
    min: 0,
    max: 1,
    step: 0.01,
    folder: NOISE_FOLDER,
  },
  noiseWarpRadius: {
    type: "number" as const,
    value: 0.7,
    min: 0,
    max: 1,
    step: 0.01,
    folder: NOISE_FOLDER,
  },
  glyphDitherEnabled: {
    type: "boolean" as const,
    value: true,
  },
  diffuseEnabled: {
    type: "boolean" as const,
    value: true,
    folder: DIFFUSE_FOLDER,
  },
  diffuseRadius: {
    type: "number" as const,
    value: 0.2,
    min: 0,
    max: 1,
    step: 0.01,
    folder: DIFFUSE_FOLDER,
  },
  blurEnabled: {
    type: "boolean" as const,
    value: true,
    folder: BLUR_FOLDER,
  },
  blurRadius: {
    type: "number" as const,
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    folder: BLUR_FOLDER,
  },
  ringSpeed: {
    type: "number" as const,
    value: 0.2,
    min: 0.02,
    max: 1,
    step: 0.02,
    folder: RING_FOLDER,
  },
  ringAlpha: {
    type: "number" as const,
    value: 1.0,
    min: 0,
    max: 1,
    step: 0.01,
    folder: RING_FOLDER,
  },
  ringPosX: {
    type: "number" as const,
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    folder: RING_FOLDER,
  },
  ringPosY: {
    type: "number" as const,
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    folder: RING_FOLDER,
  },
  borderThickness: {
    type: "number" as const,
    value: 0.07,
    min: 0.002,
    max: 0.1,
    step: 0.002,
    folder: BOLDER_FOLDER,
  },
  borderIntensity: {
    type: "number" as const,
    value: 1.0,
    min: 0,
    max: 3,
    step: 0.05,
    folder: BOLDER_FOLDER,
  },
  borderAlpha: {
    type: "number" as const,
    value: 1.0,
    min: 0,
    max: 1,
    step: 0.01,
    folder: BOLDER_FOLDER,
  },
  borderTonemap: {
    type: "boolean" as const,
    value: true,
    folder: BOLDER_FOLDER,
  },
};

function hexToRgb01(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return [0.27, 0.6, 1.0];
  }
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function ShaderScene() {
  const controls = useControls(CONTROL_SCHEMA, {
    componentName: "DitherPulseRing",
    config: {
      mainLabel: "Controls",
      showCopyButton: false,
      showCodeSnippet: true,
    },
  });

  return (
    <DitherPulseRing
      noiseWarpEnabled={
        controls.noiseWarpEnabled ?? CONTROL_SCHEMA.noiseWarpEnabled.value
      }
      noiseWarpRadius={
        controls.noiseWarpRadius ?? CONTROL_SCHEMA.noiseWarpRadius.value
      }
      noiseWarpStrength={
        controls.noiseWarpStrength ?? CONTROL_SCHEMA.noiseWarpStrength.value
      }
      glyphDitherEnabled={
        controls.glyphDitherEnabled ?? CONTROL_SCHEMA.glyphDitherEnabled.value
      }
      diffuseEnabled={
        controls.diffuseEnabled ?? CONTROL_SCHEMA.diffuseEnabled.value
      }
      blurEnabled={controls.blurEnabled ?? CONTROL_SCHEMA.blurEnabled.value}
      blurRadius={controls.blurRadius ?? CONTROL_SCHEMA.blurRadius.value}
      diffuseRadius={
        controls.diffuseRadius ?? CONTROL_SCHEMA.diffuseRadius.value
      }
      borderThickness={
        controls.borderThickness ?? CONTROL_SCHEMA.borderThickness.value
      }
      borderIntensity={
        controls.borderIntensity ?? CONTROL_SCHEMA.borderIntensity.value
      }
      borderColor={hexToRgb01(controls.color ?? CONTROL_SCHEMA.color.value)}
      borderTonemap={
        controls.borderTonemap ?? CONTROL_SCHEMA.borderTonemap.value
      }
      borderAlpha={controls.borderAlpha ?? CONTROL_SCHEMA.borderAlpha.value}
      ringColor={hexToRgb01(controls.color ?? CONTROL_SCHEMA.color.value)}
      ringSpeed={controls.ringSpeed ?? CONTROL_SCHEMA.ringSpeed.value}
      ringAlpha={controls.ringAlpha ?? CONTROL_SCHEMA.ringAlpha.value}
      ringPosition={[
        controls.ringPosX ?? CONTROL_SCHEMA.ringPosX.value,
        controls.ringPosY ?? CONTROL_SCHEMA.ringPosY.value,
      ]}
    />
  );
}

export default function DitherPulseRingPage() {
  return (
    <Playground>
      <Canvas>
        <ShaderScene />
      </Canvas>
    </Playground>
  );
}
