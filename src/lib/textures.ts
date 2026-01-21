"use client";

import * as THREE from "three";

export function createBaseTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    return new THREE.Texture();
  }

  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#0b1c2c");
  gradient.addColorStop(0.5, "#2b5b84");
  gradient.addColorStop(1, "#f4b860");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.strokeStyle = "rgba(255, 255, 255, 0.2)";
  context.lineWidth = 2;
  for (let i = 0; i < size; i += 32) {
    context.beginPath();
    context.moveTo(i, 0);
    context.lineTo(i, size);
    context.stroke();
    context.beginPath();
    context.moveTo(0, i);
    context.lineTo(size, i);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createGlyphTexture({
  spriteCount = 8,
  spriteSize = 32,
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = spriteCount * spriteSize;
  canvas.height = spriteSize;

  const context = canvas.getContext("2d");
  if (!context) {
    return new THREE.Texture();
  }

  context.fillStyle = "#000000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < spriteCount; i += 1) {
    const inset = (i / spriteCount) * (spriteSize * 0.6);
    const size = spriteSize - inset;
    const x = i * spriteSize + (spriteSize - size) / 2;
    const y = (spriteSize - size) / 2;
    context.fillStyle = "#ffffff";
    context.fillRect(x, y, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}
