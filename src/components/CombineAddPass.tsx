"use client";

import { useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";

type CombineAddPassProps = {
  inputA: THREE.Texture;
  inputB: THREE.Texture;
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  priority?: number;
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

in vec2 vUv;

uniform sampler2D uTextureA;
uniform sampler2D uTextureB;

out vec4 fragColor;

void main() {
  vec4 a = texture(uTextureA, vUv);
  vec4 b = texture(uTextureB, vUv);
  vec3 rgb = a.rgb + b.rgb;
  float alpha = max(a.a, b.a);
  fragColor = vec4(rgb, alpha);
}
`;

export default function CombineAddPass({
  inputA,
  inputB,
  target = null,
  clear = true,
  priority = 0,
}: CombineAddPassProps) {
  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTextureA: { value: inputA },
      uTextureB: { value: inputB },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTextureA.value = inputA;
  uniforms.uTextureB.value = inputB;

  return (
    <ShaderPass
      vertexShader={VERT}
      fragmentShader={FRAG}
      uniforms={uniforms}
      target={target}
      clear={clear}
      priority={priority}
      blending={THREE.NoBlending}
    />
  );
}
