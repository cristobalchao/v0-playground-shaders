"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import BorderBeamPass, {
  type BorderBeamPassUniforms,
} from "@/components/BorderBeamPass";
import BlurPass, { type BlurPassUniforms } from "@/components/BlurPass";
import CombineAddPass from "@/components/CombineAddPass";
import DiffusePass, {
  type DiffusePassUniforms,
} from "@/components/DiffusePass";
import ExpandingRingPass, {
  type ExpandingRingPassUniforms,
} from "@/components/ExpandingRingPass";
import GlyphDitherPass, {
  type GlyphDitherPassUniforms,
} from "@/components/GlyphDitherPass";
import NoiseWarpPass, {
  type NoiseWarpPassUniforms,
} from "@/components/NoiseWarpPass";
import TargetPreview from "@/components/TargetPreview";

type DitherPulseRingProps = {
  spriteTextureSrc?: string;
  glyphDitherEnabled?: boolean;
  diffuseEnabled?: boolean;
  blurEnabled?: boolean;
  noiseWarpEnabled?: boolean;
  noiseWarpRadius?: NoiseWarpPassUniforms["radius"];
  noiseWarpStrength?: NoiseWarpPassUniforms["strength"];
  diffuseRadius?: DiffusePassUniforms["diffuseRadius"];
  blurRadius?: BlurPassUniforms["blurRadius"];
  borderThickness?: number;
  borderIntensity?: number;
  borderColor?: BorderBeamPassUniforms["color"];
  borderDitherStrength?: number;
  borderTonemap?: boolean;
  borderAlpha?: number;
  ringColor?: ExpandingRingPassUniforms["color"];
  ringSpeed?: number;
  ringPosition?: ExpandingRingPassUniforms["position"];
  ringAlpha?: ExpandingRingPassUniforms["alpha"];
};

export default function DitherPulseRing({
  spriteTextureSrc = "/squares.png",
  glyphDitherEnabled = true,
  diffuseEnabled = false,
  blurEnabled = false,
  noiseWarpEnabled = false,
  noiseWarpRadius,
  noiseWarpStrength,
  diffuseRadius,
  blurRadius,
  borderThickness,
  borderIntensity,
  borderColor,
  borderDitherStrength,
  borderTonemap,
  borderAlpha,
  ringColor,
  ringSpeed,
  ringPosition,
  ringAlpha,
}: DitherPulseRingProps) {
  const { size } = useThree();

  const borderTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(1, 1, {
        depthBuffer: false,
        stencilBuffer: false,
      }),
    [],
  );

  const ringsTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(1, 1, {
        depthBuffer: false,
        stencilBuffer: false,
      }),
    [],
  );

  const combinedTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(1, 1, {
        depthBuffer: false,
        stencilBuffer: false,
      }),
    [],
  );

  const noiseTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(1, 1, {
        depthBuffer: false,
        stencilBuffer: false,
      }),
    [],
  );

  const glyphTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(1, 1, {
        depthBuffer: false,
        stencilBuffer: false,
      }),
    [],
  );

  const diffuseTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(1, 1, {
        depthBuffer: false,
        stencilBuffer: false,
      }),
    [],
  );

  const blurTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(1, 1, {
        depthBuffer: false,
        stencilBuffer: false,
      }),
    [],
  );

  useEffect(() => {
    borderTarget.setSize(size.width, size.height);
    ringsTarget.setSize(size.width, size.height);
    combinedTarget.setSize(size.width, size.height);
    noiseTarget.setSize(size.width, size.height);
    glyphTarget.setSize(size.width, size.height);
    diffuseTarget.setSize(size.width, size.height);
    blurTarget.setSize(size.width, size.height);
  }, [
    borderTarget,
    combinedTarget,
    noiseTarget,
    blurTarget,
    diffuseTarget,
    glyphTarget,
    ringsTarget,
    size.height,
    size.width,
  ]);

  useEffect(() => {
    return () => {
      borderTarget.dispose();
      ringsTarget.dispose();
      combinedTarget.dispose();
      noiseTarget.dispose();
      glyphTarget.dispose();
      diffuseTarget.dispose();
      blurTarget.dispose();
    };
  }, [
    borderTarget,
    noiseTarget,
    blurTarget,
    combinedTarget,
    diffuseTarget,
    glyphTarget,
    ringsTarget,
  ]);

  const glyphUniforms: Partial<GlyphDitherPassUniforms> = {};
  glyphUniforms.trackMouse = false;

  const noiseUniforms: Partial<NoiseWarpPassUniforms> = {};
  noiseUniforms.trackMouse = false;
  if (noiseWarpRadius !== undefined) {
    noiseUniforms.radius = noiseWarpRadius;
  }
  if (noiseWarpStrength !== undefined) {
    noiseUniforms.strength = noiseWarpStrength;
  }

  const diffuseUniforms: Partial<DiffusePassUniforms> = {};
  diffuseUniforms.trackMouse = false;
  if (diffuseRadius !== undefined) {
    diffuseUniforms.diffuseRadius = diffuseRadius;
  }

  const blurUniforms: Partial<BlurPassUniforms> = {};
  blurUniforms.trackMouse = false;
  if (blurRadius !== undefined) {
    blurUniforms.blurRadius = blurRadius;
  }

  const borderUniforms: Partial<BorderBeamPassUniforms> = {};
  if (borderThickness !== undefined) borderUniforms.thickness = borderThickness;
  if (borderIntensity !== undefined) borderUniforms.intensity = borderIntensity;
  if (borderColor) borderUniforms.color = borderColor;
  if (borderDitherStrength !== undefined) {
    borderUniforms.ditherStrength = borderDitherStrength;
  }
  if (borderTonemap !== undefined) borderUniforms.tonemap = borderTonemap;
  if (borderAlpha !== undefined) borderUniforms.alpha = borderAlpha;

  const ringUniforms: Partial<ExpandingRingPassUniforms> = {};
  if (ringColor) ringUniforms.color = ringColor;
  if (ringSpeed !== undefined) ringUniforms.speed = ringSpeed;
  if (ringPosition) ringUniforms.position = ringPosition;
  if (ringAlpha !== undefined) ringUniforms.alpha = ringAlpha;

  return (
    <>
      <BorderBeamPass target={borderTarget} uniforms={borderUniforms} />
      <ExpandingRingPass target={ringsTarget} clear uniforms={ringUniforms} />
      <CombineAddPass
        inputA={borderTarget.texture}
        inputB={ringsTarget.texture}
        target={combinedTarget}
      />
      {noiseWarpEnabled && (
        <NoiseWarpPass
          inputTexture={combinedTarget.texture}
          target={noiseTarget}
          uniforms={noiseUniforms}
        />
      )}
      {glyphDitherEnabled && (
        <GlyphDitherPass
          inputTexture={
            noiseWarpEnabled ? noiseTarget.texture : combinedTarget.texture
          }
          spriteTextureSrc={spriteTextureSrc}
          target={glyphTarget}
          uniforms={glyphUniforms}
        />
      )}
      {diffuseEnabled && (
        <DiffusePass
          inputTexture={
            glyphDitherEnabled
              ? glyphTarget.texture
              : noiseWarpEnabled
                ? noiseTarget.texture
                : combinedTarget.texture
          }
          target={diffuseTarget}
          uniforms={diffuseUniforms}
        />
      )}
      {blurEnabled && (
        <BlurPass
          inputTexture={
            diffuseEnabled
              ? diffuseTarget.texture
              : glyphDitherEnabled
                ? glyphTarget.texture
                : noiseWarpEnabled
                  ? noiseTarget.texture
                : combinedTarget.texture
          }
          target={blurTarget}
          uniforms={blurUniforms}
        />
      )}
      <TargetPreview
        target={
          blurEnabled
            ? blurTarget
            : diffuseEnabled
              ? diffuseTarget
              : glyphDitherEnabled
                ? glyphTarget
                : noiseWarpEnabled
                  ? noiseTarget
                : combinedTarget
        }
        renderOrder={0}
        blending={THREE.NormalBlending}
      />
    </>
  );
}
