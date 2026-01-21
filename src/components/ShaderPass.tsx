"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export type ShaderPassProps = {
  /** GLSL vertex shader */
  vertexShader: string;
  /** GLSL fragment shader */
  fragmentShader: string;

  /** Shader uniforms object (R3F-compatible) */
  uniforms: Record<string, THREE.IUniform>;

  /** Name of the sampler2D uniform that receives inputTexture (default: "uTexture") */
  inputUniform?: string;

  /** Texture that this pass samples from (optional) */
  inputTexture?: THREE.Texture | null;

  /** Render target to write into. If omitted, renders to screen (canvas) */
  target?: THREE.WebGLRenderTarget | null;

  /** Whether to clear the target before rendering this pass */
  clear?: boolean;

  /** Clear color (only used when clear=true) */
  clearColor?: THREE.ColorRepresentation;

  /** Override blending if you want additive / difference passes later */
  blending?: THREE.Blending;
  transparent?: boolean;

  /** Disable pass rendering without unmounting */
  enabled?: boolean;

  /** Optional: update a time uniform each frame */
  timeUniform?: string;

  /** Optional: update a resolution uniform each frame */
  resolutionUniform?: string;

  /** Render priority in the frame loop (lower runs earlier) */
  priority?: number;
};

export default function ShaderPass({
  vertexShader,
  fragmentShader,
  uniforms,
  inputUniform = "uTexture",
  inputTexture = null,
  target = null,
  clear = true,
  clearColor = 0x000000,
  blending = THREE.NoBlending,
  transparent = false,
  enabled = true,
  timeUniform,
  resolutionUniform,
  priority = 0,
}: ShaderPassProps) {
  const { gl, size } = useThree();

  // Offscreen scene + ortho camera for the pass
  const passScene = useMemo(() => new THREE.Scene(), []);
  const passCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    [],
  );

  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Fullscreen quad geometry (two triangles) in clip-space
  const quadGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array([
      -1, -1, 0, 1, -1, 0, 1, 1, 0,

      -1, -1, 0, 1, 1, 0, -1, 1, 0,
    ]);
    const uvs = new Float32Array([
      0, 0, 1, 0, 1, 1,

      0, 0, 1, 1, 0, 1,
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    return geom;
  }, []);

  const quadMesh = useMemo(() => {
    const mesh = new THREE.Mesh(quadGeom);
    mesh.frustumCulled = false;
    return mesh;
  }, [quadGeom]);

  // Attach quad to the passScene
  useEffect(() => {
    passScene.add(quadMesh);
    return () => {
      passScene.remove(quadMesh);
      quadGeom.dispose();
      // material disposed by R3F when unmounted, but safe to null ref.
      materialRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passScene, quadMesh]);

  // Keep uniforms wired for inputTexture
  useEffect(() => {
    if (!enabled) return;
    if (!inputTexture) return;
    const u = uniforms?.[inputUniform];
    if (u) u.value = inputTexture;
  }, [enabled, inputTexture, inputUniform, uniforms]);

  // Render the pass each frame
  useFrame((state, delta) => {
    if (!enabled) return;

    // Update time uniform if requested
    if (timeUniform && uniforms[timeUniform]) {
      uniforms[timeUniform].value = (uniforms[timeUniform].value ?? 0) + delta;
    }

    // Update resolution uniform if requested
    if (resolutionUniform && uniforms[resolutionUniform]) {
      const v = uniforms[resolutionUniform].value as THREE.Vector2;
      if (v?.set) v.set(size.width, size.height);
    }

    const prevTarget = gl.getRenderTarget();
    const prevAutoClear = gl.autoClear;

    gl.autoClear = false;

    if (target) gl.setRenderTarget(target);
    else gl.setRenderTarget(null);

    if (clear) {
      const prevClear = gl.getClearColor(new THREE.Color());
      const prevAlpha = gl.getClearAlpha();

      gl.setClearColor(new THREE.Color(clearColor), 1);
      gl.clear(true, true, true);

      gl.setClearColor(prevClear, prevAlpha);
    }

    gl.render(passScene, passCamera);

    gl.setRenderTarget(prevTarget);
    gl.autoClear = prevAutoClear;
  }, priority);

  // We mount a shaderMaterial onto the quad via a portal to the passScene
  // so R3F can manage the material lifecycle.
  return createPortal(
    <shaderMaterial
      ref={(m) => {
        materialRef.current = m as unknown as THREE.ShaderMaterial;
        // Assign to quad mesh once material exists
        if (m) quadMesh.material = m as unknown as THREE.Material;
      }}
      glslVersion={THREE.GLSL3}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      blending={blending}
      transparent={transparent}
      depthTest={false}
      depthWrite={false}
    />,
    passScene,
  );
}
