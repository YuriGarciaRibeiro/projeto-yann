import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectPageSource = readFileSync(join(currentDir, "ProjectPage.tsx"), "utf8");
const projectHeroSource = readFileSync(join(currentDir, "ProjectHero.tsx"), "utf8");
const scrollVideoParallaxSource = readFileSync(
  join(currentDir, "..", "ScrollVideoParallax.tsx"),
  "utf8",
);
const parallaxVideoSectionSource = readFileSync(
  join(currentDir, "section-renderers", "ParallaxVideoSection.tsx"),
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
  /import Image from "next\/image";/,
  "project pages should import Next Image for the persistent project logo",
);

assert.match(
  projectPageSource,
  /<header className="(?=[^"]*pointer-events-none)(?=[^"]*fixed)(?=[^"]*inset-x-0)(?=[^"]*top-0)(?=[^"]*z-50)(?=[^"]*px-5)(?=[^"]*py-5)(?=[^"]*text-white)(?=[^"]*sm:px-8)(?=[^"]*lg:px-8)(?=[^"]*xl:px-10)[^"]*">/,
  "project pages should align the fixed logo header with the hero text grid",
);

assert.match(
  projectPageSource,
  /className="(?=[^"]*h-9)(?=[^"]*w-auto)(?=[^"]*sm:h-10)(?=[^"]*lg:h-11)[^"]*"/,
  "the persistent logo should use the approved smaller responsive scale",
);

assert.doesNotMatch(
  projectPageSource,
  /max-w-360/,
  "fixed logo header should not use a centered max-width that misaligns with project text",
);

assert.doesNotMatch(
  projectHeroSource,
  /src="\/logo\.png"/,
  "ProjectHero should not render a duplicate hero-only logo after ProjectPage owns the fixed header",
);

assert.doesNotMatch(
  projectHeroSource,
  /project-scrub-flow/,
  "ProjectHero should not use scrub-flow transition gradients that darken hero video edges",
);

assert.doesNotMatch(
  projectHeroSource,
  /bg-\[linear-gradient\((90deg|0deg),rgb\(0_0_0\/0\./,
  "ProjectHero should not render full-frame dark gradient overlays over hero media",
);

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

assert.match(
  globalsSource,
  /--text-hero-title: clamp\(2\.6rem, 5\.8vw, 5\.25rem\);/,
  "project hero title token should use the approved smaller scale",
);

assert.match(
  globalsSource,
  /--text-project-title: clamp\(1\.9rem, 3\.4vw, 3\.35rem\);/,
  "project parallax title token should use the approved smaller scale",
);

assert.match(
  globalsSource,
  /--text-body-large: clamp\(0\.925rem, 1vw, 1\.0625rem\);/,
  "large project body text should use the approved smaller scale",
);

assert.match(
  globalsSource,
  /--text-caption: 0\.875rem;/,
  "project captions should use the approved smaller scale",
);

assert.match(
  globalsSource,
  /--text-meta: 0\.8125rem;/,
  "project metadata should use the approved smaller scale",
);

assert.match(
  globalsSource,
  /--text-label: 0\.5625rem;/,
  "project labels should use the approved smaller scale",
);

assert.match(
  projectHeroSource,
  /className="(?=[^"]*max-w-none)(?=[^"]*items-end)(?=[^"]*lg:px-8)(?=[^"]*xl:px-10)[^"]*"/,
  "project hero text grid should use a wider lateral layout with bottom-aligned blocks",
);

assert.match(
  projectHeroSource,
  /className="(?=[^"]*col-span-4)(?=[^"]*self-end)(?=[^"]*lg:col-span-7)[^"]*"/,
  "project hero title block should align to the bottom of the hero text row",
);

assert.match(
  projectHeroSource,
  /<dl className="(?=[^"]*col-span-4)(?=[^"]*self-end)(?=[^"]*border-white\/10)(?=[^"]*bg-white\/\[0\.045\])(?=[^"]*px-4)(?=[^"]*py-3)(?=[^"]*lg:col-start-10)[^"]*"/,
  "project hero metadata block should align to the bottom and use the shared subtle white text background",
);

assert.match(
  projectHeroSource,
  /<dt className="(?=[^"]*text-label)(?=[^"]*text-white\/72)[^"]*"/,
  "project hero metadata labels should use the same color as the metadata values",
);

assert.match(
  parallaxVideoSectionSource,
  /className="(?=[^"]*border-white\/10)(?=[^"]*bg-white\/\[0\.045\])(?=[^"]*text-caption)[^"]*"/,
  "standalone parallax captions should use the shared subtle white text background",
);

assert.match(
  parallaxVideoSequenceSource,
  /className="(?=[^"]*border-white\/10)(?=[^"]*bg-white\/\[0\.045\])(?=[^"]*text-caption)[^"]*"/,
  "parallax sequence captions should use the shared subtle white text background",
);

assert.match(
  parallaxVideoSectionSource,
  /className="(?=[^"]*max-w-none)(?=[^"]*lg:px-8)(?=[^"]*xl:px-10)[^"]*"/,
  "standalone parallax text grid should use a wider lateral layout",
);

assert.match(
  parallaxVideoSequenceSource,
  /className="(?=[^"]*max-w-none)(?=[^"]*lg:px-8)(?=[^"]*xl:px-10)[^"]*"/,
  "parallax sequence text grids should use a wider lateral layout",
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

assert.doesNotMatch(
  scrollVideoParallaxSource,
  /shadeOpacity/,
  "scroll video media should not animate a black shade overlay over the video while scrubbing",
);

assert.doesNotMatch(
  scrollVideoParallaxSource,
  /<motion\.div className="absolute inset-0 bg-black"/,
  "scroll video media should not render a full-frame black darkening overlay over the video",
);

assert.match(
  parallaxVideoSequenceSource,
  /className="(?=[^"]*project-scroll-range)(?=[^"]*project-scrub-flow)(?=[^"]*project-parallax-sequence)[^"]*"/,
  "parallax video sequences should expose the expected outer scroll range classes",
);

assert.match(
  parallaxVideoSequenceSource,
  /className="(?=[^"]*project-scroll-stage)(?=[^"]*sticky)(?=[^"]*top-0)(?=[^"]*min-h-svh)(?=[^"]*overflow-hidden)[^"]*"/,
  "parallax video sequences should use the standard sticky stage classes",
);

assert.doesNotMatch(
  parallaxVideoSequenceSource,
  /margin-top:\s*-\d+svh/,
  "parallax video sequences should not use negative margins to stack segments",
);

assert.doesNotMatch(
  parallaxVideoSectionSource,
  /bg-\[linear-gradient\(90deg,rgb\(0_0_0\/0\.58\)/,
  "standalone parallax videos should not add a constant left darkening overlay",
);

assert.doesNotMatch(
  parallaxVideoSectionSource,
  /bg-\[linear-gradient\(0deg,rgb\(0_0_0\/0\.56\)/,
  "standalone parallax videos should not add a constant bottom darkening overlay",
);

assert.doesNotMatch(
  parallaxVideoSequenceSource,
  /bg-\[linear-gradient\(90deg,rgb\(0_0_0\/0\.(58|62)\)/,
  "parallax video sequences should not add constant left darkening overlays",
);

assert.doesNotMatch(
  parallaxVideoSequenceSource,
  /bg-\[linear-gradient\(0deg,rgb\(0_0_0\/0\.(56|6)\)/,
  "parallax video sequences should not add constant bottom darkening overlays",
);

assert.match(
  globalsSource,
  /\.project-scrub-flow::before\s*\{[^}]*rgb\(5 5 5 \/ 0\.72\)/,
  "transition darkening between parallax blocks should remain in the project scrub flow before gradient",
);

assert.match(
  globalsSource,
  /\.project-scrub-flow::after\s*\{[^}]*rgb\(5 5 5 \/ 0\.74\)/,
  "transition darkening between parallax blocks should remain in the project scrub flow after gradient",
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
  /controlledProgress=\{[\s\S]*isActive[\s\S]*activeSegmentProgress[\s\S]*index < activeIndex[\s\S]*1[\s\S]*0[\s\S]*\}/,
  "parallax video sequences should scrub only the active mounted video with local segment progress",
);

assert.match(
  parallaxVideoSequenceSource,
  /shouldWriteScrollHeight=\{\s*false\s*\}/,
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
  scrollVideoParallaxSource,
  /damping: 30,[\s\S]*stiffness: 100,/,
  "scroll scrub spring should keep the calibrated response used across pointer types",
);

assert.match(
  scrollVideoParallaxSource,
  /Math\.abs\(delta\) > 0\.015[\s\S]*delta \* 0\.22/,
  "scroll scrub video seeks should keep the calibrated target-time response",
);

assert.match(
  scrollVideoParallaxSource,
  /const shouldAnimateVideo =[\s\S]*controlledProgress === undefined[\s\S]*controlledMotionProgress !== null/,
  "inactive sequence videos with numeric controlled progress should not run requestAnimationFrame scrub loops",
);

assert.match(
  scrollVideoParallaxSource,
  /if \(!video \|\| !isNearViewport \|\| !shouldAnimateVideo\)/,
  "scroll scrub should skip RAF work when a mounted sequence video is not active",
);

assert.match(
  scrollVideoParallaxSource,
  /const MIN_SEEK_INTERVAL_MS = 22/,
  "active scroll scrub should throttle video seeks to roughly 45fps",
);

assert.match(
  scrollVideoParallaxSource,
  /now - lastSeekAtRef\.current >= MIN_SEEK_INTERVAL_MS/,
  "scroll scrub should not assign currentTime on every requestAnimationFrame",
);

assert.match(
  scrollVideoParallaxSource,
  /preload=\{[\s\S]*shouldAnimateVideo[\s\S]*isNearViewport[\s\S]*isVideoFrameReady[\s\S]*"auto"[\s\S]*"none"[\s\S]*\}/,
  "inactive sequence videos should not preload full video data while another video is active",
);

assert.match(
  parallaxVideoSequenceSource,
  /preload="metadata"/,
  "hidden sequence metadata probes should not preload full videos",
);

assert.doesNotMatch(
  parallaxVideoSequenceSource,
  /className="pointer-events-none absolute size-px overflow-hidden opacity-0"[\s\S]*preload="auto"/,
  "hidden sequence metadata probes should avoid duplicate full-video downloads",
);

assert.match(
  parallaxVideoSequenceSource,
  /style=\{\{ scaleX: smoothScrollYProgress \}\}/,
  "parallax video sequences should expose a bottom progress indicator linked to the smoothed combined sequence scroll progress",
);
