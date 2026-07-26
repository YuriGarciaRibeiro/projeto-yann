import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(currentDir, "VideoBlockSection.tsx"), "utf8");

assert.match(
  source,
  /<iframe[\s\S]*className="h-full w-full"[\s\S]*src=\{youtubeEmbedUrl\}/,
  "YouTube iframe should remain visible on mobile when a YouTube URL is configured",
);

assert.doesNotMatch(
  source,
  /youtubeEmbedUrl \? \([\s\S]*className="h-full w-full object-cover sm:hidden"/,
  "video blocks should not replace YouTube embeds with uploaded project video on mobile",
);
