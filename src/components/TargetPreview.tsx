"use client";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type TargetPreviewProps = {
  target: THREE.WebGLRenderTarget;
  renderOrder: number;
  blending?: THREE.Blending;
};

export default function TargetPreview({
  target,
  renderOrder,
  blending = THREE.NoBlending,
}: TargetPreviewProps) {
  const { viewport } = useThree();

  return (
    <mesh
      scale={[viewport.width, viewport.height, 1]}
      renderOrder={renderOrder}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={target.texture}
        toneMapped={false}
        transparent
        blending={blending}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
