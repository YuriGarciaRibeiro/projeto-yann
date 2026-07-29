import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const mediaFallbackSource = readFileSync(join(currentDir, "ProjectMediaFallback.tsx"), "utf8");
const projectScrollMediaSource = readFileSync(join(currentDir, "..", "ProjectScrollMedia.tsx"), "utf8");
const nextConfigSource = readFileSync(
  join(currentDir, "..", "..", "..", "..", "next.config.ts"),
  "utf8",
);

assert.match(
  mediaFallbackSource,
  /import NextImage from "next\/image";/,
  "project fallback images should use Next Image for optimized delivery when dimensions are available",
);

assert.match(
  mediaFallbackSource,
  /width\?: number \| null;/,
  "project fallback images should accept asset width metadata",
);

assert.match(
  mediaFallbackSource,
  /height\?: number \| null;/,
  "project fallback images should accept asset height metadata",
);

assert.match(
  mediaFallbackSource,
  /loading="lazy"/,
  "project fallback images should lazy-load when they are outside the initial viewport",
);

assert.match(
  mediaFallbackSource,
  /decoding="async"/,
  "project fallback images should decode asynchronously",
);

assert.match(
  projectScrollMediaSource,
  /import NextImage from "next\/image";/,
  "the hero poster fallback should use Next Image instead of a CSS background",
);

assert.match(
  projectScrollMediaSource,
  /<NextImage alt=\{alt\} className="object-cover" fill priority sizes="100vw" src=\{posterSrc\} \/>/,
  "the hero poster fallback should fill the full media frame",
);

assert.match(
  nextConfigSource,
  /remotePatterns/,
  "next.config.ts should allow remote backend media for Next Image optimization",
);
