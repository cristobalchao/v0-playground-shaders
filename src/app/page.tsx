"use client";

import Link from "next/link";

export default function Home() {
  const links = [
    { href: "/shader-art", label: "Shader Art" },
    { href: "/gradient-effect", label: "Gradient Effect" },
    { href: "/border-shape", label: "Border Shape" },
    { href: "/sha-shape", label: "Sha Shape" },
    { href: "/bram-no-blend", label: "Bram No Blend" },
    { href: "/bram-no-blend-effects", label: "Bram No Blend Effects" },
    { href: "/text-overlay", label: "Text Overlay" },
    { href: "/diffuse-effect", label: "Diffuse Effect" },
    { href: "/beam-edge-thin", label: "Beam Edge Thin" },
    { href: "/beam-edge-thick", label: "Beam Edge Thick" },
    { href: "/beam-rings", label: "Beam Rings" },
    { href: "/replicate-diagonal", label: "Replicate Diagonal" },
    { href: "/replicate-vertical", label: "Replicate Vertical" },
    { href: "/blur-effect", label: "Blur Effect" },
    { href: "/noise-effect", label: "Noise Effect" },
    { href: "/glyph-dither", label: "Glyph Dither" },
  ];

  return (
    <main>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
