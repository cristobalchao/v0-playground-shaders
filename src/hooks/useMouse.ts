"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type UseMouseOptions = {
  enabled: boolean;
  center?: { x: number; y: number };
};

export default function useMouse({ enabled, center }: UseMouseOptions) {
  const { gl } = useThree();
  const mouse = useMemo(
    () => new THREE.Vector2(center?.x ?? 0.5, center?.y ?? 0.5),
    [center?.x, center?.y],
  );
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (!enabled) {
      mouse.set(center?.x ?? 0.5, center?.y ?? 0.5);
      return;
    }

    const updateRect = () => {
      rectRef.current = gl.domElement.getBoundingClientRect();
    };

    updateRect();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = rectRef.current;
      if (!rect || rect.width === 0 || rect.height === 0) {
        return;
      }
      const mouseX = (event.clientX - rect.left) / rect.width;
      const mouseY = 1 - (event.clientY - rect.top) / rect.height;

      mouse.set(
        Math.min(1, Math.max(0, mouseX)),
        Math.min(1, Math.max(0, mouseY)),
      );
    };

    const handleResize = () => {
      updateRect();
    };

    const handleMouseEnter = () => {
      updateRect();
    };

    const handleMouseLeave = () => {
      mouse.set(center?.x ?? 0.5, center?.y ?? 0.5);
    };

    const element = gl.domElement;
    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, [center?.x, center?.y, enabled, gl, mouse]);

  return mouse;
}
