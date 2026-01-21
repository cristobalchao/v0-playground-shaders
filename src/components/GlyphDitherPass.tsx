"use client";

import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import useMouse from "@/hooks/useMouse";

export type GlyphDitherPassUniforms = {
  trackMouse: boolean;
};

type GlyphDitherPassProps = {
  inputTexture?: THREE.Texture | null;
  spriteTextureSrc?: string;
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  clearColor?: THREE.ColorRepresentation;
  enabled?: boolean;
  priority?: number;
  uniforms?: Partial<GlyphDitherPassUniforms>;
};

const DEFAULTS: GlyphDitherPassUniforms = {
  trackMouse: true,
};

const VERT = `
out vec2 vTextureCoord;

uniform mat4 uTextureMatrix;

void main() {
  vTextureCoord = (uTextureMatrix * vec4(uv, 0.0, 1.0)).xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
precision highp float;

in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform sampler2D uSprite;
uniform sampler2D uCustomTexture;
uniform vec2 uMousePos;
uniform vec2 uResolution;

out vec4 fragColor;

void main() {
  vec2 uv = vTextureCoord;
  vec2 pos = vec2(0.5, 0.5) + mix(vec2(0.0), (uMousePos - 0.5), 0.0000);
  float aspectRatio = uResolution.x / uResolution.y;
  float aspectCorrection = mix(aspectRatio, 1.0 / aspectRatio, 0.5);

  float gridSize = mix(0.05, 0.005, 1.0000);
  float baseGrid = 1.0 / gridSize;
  vec2 cellSize = vec2(1.0 / (baseGrid * aspectRatio), 1.0 / baseGrid) * aspectCorrection;

  vec2 offsetUv = uv - pos;
  vec2 cell = floor(offsetUv / cellSize);
  vec2 cellCenter = (cell + 0.5) * cellSize;
  vec2 pixelatedCoord = cellCenter + pos;

  vec4 bg = texture(uTexture, vTextureCoord);
  vec4 color = texture(uTexture, pixelatedCoord);

  float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  luminance = mix(luminance, 1.0 - luminance, float(0));

  float gamma = pow(mix(0.2, 2.2, 0.5800), 2.2);

  ivec2 customTextureSize = textureSize(uCustomTexture, 0);
  ivec2 spriteTextureSize = textureSize(uSprite, 0);
  float selectedWidth = mix(float(spriteTextureSize.x), float(customTextureSize.x), float(0 == 6));
  float GLYPH_HEIGHT = mix(float(spriteTextureSize.y), float(customTextureSize.y), float(0 == 6));
  float scaleFactor = gridSize / GLYPH_HEIGHT;

  float numSprites = max(1.0, selectedWidth / GLYPH_HEIGHT);
  float numGlyphRows = 1.0;

  float spriteIndex = clamp(floor(luminance * numSprites), 0.0, numSprites - 1.0);
  float spriteIndexWithGamma = clamp(floor(luminance * numSprites * gamma), 0.0, numSprites - 1.0);

  float glyphIndex = 0.0;
  float normalizedSpriteSizeX = 1.0 / numSprites;
  float normalizedSpriteSizeY = 1.0 / numGlyphRows;

  float spriteX = (spriteIndexWithGamma * normalizedSpriteSizeX);
  vec2 spriteSheetUV = vec2(spriteX, glyphIndex / numGlyphRows);

  vec2 spriteSize = vec2(GLYPH_HEIGHT / aspectRatio, GLYPH_HEIGHT) * scaleFactor * aspectCorrection;
  vec2 localOffset = mod(uv - pos, spriteSize) / spriteSize;

  float inset = 0.5 / GLYPH_HEIGHT;
  localOffset = clamp(localOffset, inset, 1.0 - inset);

  spriteSheetUV += vec2(localOffset.x * normalizedSpriteSizeX, localOffset.y * normalizedSpriteSizeY);

  vec4 spriteColor = texture(uSprite, spriteSheetUV);
  float alpha = smoothstep(0.0, 1.0, spriteColor.r);

  vec3 cc = (color.rgb - spriteIndex * 0.04) * 1.4;
  vec3 col = mix(cc, vec3(0.0, 1.0, 1.0), float(0));
  vec3 dithered = mix(mix(vec3(0.0), vec3(1.0), float(0)), col, alpha);

  color.rgb = mix(bg.rgb, dithered, 0.5000);
  fragColor = color;
}
`;

export default function GlyphDitherPass({
  inputTexture = null,
  spriteTextureSrc = "/squares.png",
  target = null,
  clear = false,
  clearColor = 0x000000,
  enabled = true,
  priority = 0,
  uniforms: uniformsOverride = {},
}: GlyphDitherPassProps) {
  const u = { ...DEFAULTS, ...uniformsOverride };
  const mousePos = useMouse({ enabled: u.trackMouse });
  const spriteTexture = useLoader(THREE.TextureLoader, spriteTextureSrc);
  const fallbackTexture = useMemo(() => {
    const data = new Uint8Array([0, 0, 0, 255]);
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => {
    if (!inputTexture) {
      console.warn("GlyphDitherPass: inputTexture is required.");
    }
    spriteTexture.wrapS = THREE.ClampToEdgeWrapping;
    spriteTexture.wrapT = THREE.ClampToEdgeWrapping;
    spriteTexture.generateMipmaps = false;
    spriteTexture.minFilter = THREE.NearestFilter;
    spriteTexture.magFilter = THREE.NearestFilter;
    spriteTexture.needsUpdate = true;
  }, [inputTexture, spriteTexture]);

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTexture: { value: inputTexture ?? fallbackTexture },
      uSprite: { value: spriteTexture },
      uCustomTexture: { value: spriteTexture },
      uTextureMatrix: { value: new THREE.Matrix4() },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMousePos: { value: mousePos },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTexture.value = inputTexture ?? fallbackTexture;
  uniforms.uCustomTexture.value = spriteTexture;
  uniforms.uSprite.value = spriteTexture;
  uniforms.uMousePos.value = mousePos;

  return (
    <ShaderPass
      vertexShader={VERT}
      fragmentShader={FRAG}
      uniforms={uniforms}
      target={target}
      clear={clear}
      clearColor={clearColor}
      enabled={enabled}
      priority={priority}
      resolutionUniform="uResolution"
      blending={THREE.NoBlending}
    />
  );
}
