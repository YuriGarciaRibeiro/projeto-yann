import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectPageSource = readFileSync(join(currentDir, "ProjectPage.tsx"), "utf8");
const scrollVideoParallaxSource = readFileSync(
  join(currentDir, "..", "ScrollVideoParallax.tsx"),
  "utf8",
);
const globalsSource = readFileSync(join(currentDir, "..", "..", "globals.css"), "utf8");

assert.match(
  projectPageSource,
  /overlapPrevious=\{false\}/,
  "parallax video sections should not overlap the previous stage because stacked videos create a visible horizontal band",
);

assert.doesNotMatch(
  projectPageSource,
  /const shouldOverlapPrevious/,
  "project pages should not compute video overlap state while transitions are handled inside each sticky stage",
);

assert.doesNotMatch(
  globalsSource,
  /\.project-parallax-overlap::before/,
  "parallax overlap seam masks should not exist because they render as visible rectangular bands",
);

assert.doesNotMatch(
  globalsSource,
  /margin-top:\s*-\d+svh/,
  "parallax sections should not use negative margins to stack one video over another",
);

assert.doesNotMatch(
  scrollVideoParallaxSource,
  /const mediaScale = useTransform/,
  "scroll video media should not use a settle scale transform",
);

assert.doesNotMatch(
  scrollVideoParallaxSource,
  /const mediaY = useTransform/,
  "scroll video media should not use a settle position transform",
);

assert.doesNotMatch(
  scrollVideoParallaxSource,
  /style=\{\{ scale: mediaScale, y: mediaY \}\}/,
  "the video layer should not receive settle transforms",
);
