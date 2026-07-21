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
const parallaxVideoSequenceSource = readFileSync(
  join(currentDir, "section-renderers", "ParallaxVideoSequence.tsx"),
  "utf8",
);
const globalsSource = readFileSync(join(currentDir, "..", "..", "globals.css"), "utf8");
const projectPreloaderSource = readFileSync(join(currentDir, "ProjectPreloader.tsx"), "utf8");

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

assert.doesNotMatch(
  scrollVideoParallaxSource,
  /radial-gradient/,
  "scroll video media should not add a global vignette that darkens the video borders",
);

assert.match(
  parallaxVideoSequenceSource,
  /className="project-scroll-range project-scrub-flow project-parallax-sequence/,
  "parallax video sequences should expose the expected outer scroll range classes",
);

assert.match(
  parallaxVideoSequenceSource,
  /className="project-scroll-stage sticky top-0 min-h-svh overflow-hidden"/,
  "parallax video sequences should use the standard sticky stage classes",
);

assert.doesNotMatch(
  parallaxVideoSequenceSource,
  /margin-top:\s*-\d+svh/,
  "parallax video sequences should not use negative margins to stack segments",
);

assert.match(
  scrollVideoParallaxSource,
  /controlledProgress\?: number/,
  "scroll video media should support controlled local segment progress for grouped sequences",
);

assert.match(
  scrollVideoParallaxSource,
  /shouldWriteScrollHeight\?: boolean/,
  "scroll video media should allow grouped sequences to own the outer scroll-height variable",
);

assert.match(
  parallaxVideoSequenceSource,
  /controlledProgress=\{isActive \? activeSegmentProgress : index < activeIndex \? 1 : 0\}/,
  "parallax video sequences should scrub only the active mounted video with local segment progress",
);

assert.match(
  parallaxVideoSequenceSource,
  /shouldWriteScrollHeight=\{false\}/,
  "parallax video sequences should prevent child media from overwriting the aggregate range height",
);

assert.match(
  parallaxVideoSequenceSource,
  /prefers-reduced-motion: no-preference\) and \(pointer: fine/,
  "parallax video sequences should only enhance sticky scrubbing for fine pointers without reduced motion",
);

assert.match(
  parallaxVideoSequenceSource,
  /data-sequence-mode="fallback"/,
  "parallax video sequences should expose a normal-flow fallback mode",
);

assert.match(
  parallaxVideoSequenceSource,
  /data-sequence-mode="fallback"[\s\S]*ref=\{sectionRef\}/,
  "parallax video sequence fallback should hydrate the useScroll target ref",
);

assert.match(
  parallaxVideoSequenceSource,
  /sectionRows\.map\(\(sectionRow\) => \{/,
  "parallax video sequence fallback should render every grouped row in document flow",
);

assert.match(
  scrollVideoParallaxSource,
  /controlledMotionProgress\.get\(\)/,
  "controlled MotionValue progress should initialize from the current value on mount or controlled source changes",
);

assert.match(
  scrollVideoParallaxSource,
  /videoRef\.current\.currentTime = targetTimeRef\.current/,
  "controlled scrub videos should snap to the correct frame before a sequence layer becomes visible",
);

assert.match(
  scrollVideoParallaxSource,
  /posterSrc\?: string \| null/,
  "scroll video media should accept a poster placeholder to avoid black flashes while a new video frame loads",
);

assert.match(
  scrollVideoParallaxSource,
  /backgroundImage: `url\(\$\{posterSrc\}\)`/,
  "scroll video media should render the poster behind the video while opacity transitions settle",
);

assert.match(
  scrollVideoParallaxSource,
  /poster=\{posterSrc \?\? undefined\}/,
  "scroll video elements should receive the poster source for native frame fallback",
);

assert.match(
  parallaxVideoSequenceSource,
  /sectionRows\.map\(\(sectionRow, index\) => \{/,
  "enhanced parallax sequences should keep every sequence video mounted to avoid black flashes during segment changes",
);

assert.match(
  parallaxVideoSequenceSource,
  /isActive \? "opacity-100" : "opacity-0"/,
  "enhanced parallax sequences should switch mounted video layers with opacity instead of remounting media",
);

assert.match(
  projectPageSource,
  /preloadMedia=\{preloadMedia\}/,
  "project pages should pass sequence video assets into the initial preloader",
);

assert.match(
  projectPreloaderSource,
  /preloadMedia: ProjectPreloadMedia\[\]/,
  "project preloader should accept the full set of project videos that must be ready before the loading overlay exits",
);

assert.match(
  scrollVideoParallaxSource,
  /useMotionValueEvent\(smoothScrollYProgress, "change"/,
  "isolated scroll video parallax sections should smooth scroll progress before targeting video time",
);

assert.match(
  parallaxVideoSequenceSource,
  /style=\{\{ scaleX: smoothScrollYProgress \}\}/,
  "parallax video sequences should expose a bottom progress indicator linked to the smoothed combined sequence scroll progress",
);
