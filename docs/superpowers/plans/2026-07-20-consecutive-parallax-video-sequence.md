# Consecutive Parallax Video Sequence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render consecutive project `parallax_video` sections as one sticky scrub sequence so the viewport stays fixed until the full video run completes.

**Architecture:** Add a small pure grouping helper for project sections, extract the scrub-height calculation from `ScrollVideoParallax`, and introduce a client `ParallaxVideoSequence` that owns one scroll range and sticky stage for consecutive videos. Isolated parallax sections keep using `ParallaxVideoSection` unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, Framer Motion `useScroll`, TypeScript, Node assert tests, CSS custom properties.

---

## File Structure

- Create `apps/web/src/app/components/project-page/groupProjectSections.ts`: pure server-safe helper that converts section rows into render groups.
- Create `apps/web/src/app/components/project-page/groupProjectSections.test.ts`: Node assert tests for consecutive/non-consecutive grouping.
- Create `apps/web/src/app/components/scrollVideoScrub.ts`: shared constants and `getScrubScrollHeightSvh(durationSeconds)` helper.
- Modify `apps/web/src/app/components/ScrollVideoParallax.tsx`: use the shared helper and export no new component API.
- Create `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`: client component that renders one sticky stage for 2+ consecutive parallax sections.
- Modify `apps/web/src/app/components/project-page/ProjectPage.tsx`: render grouped section rows and send parallax groups to `ParallaxVideoSequence`.
- Modify `apps/web/src/app/components/project-page/parallax-transition.test.ts`: assert sequence constraints and keep existing anti-overlap protections.

## Tasks

### Task 1: Add Pure Section Grouping

**Files:**
- Create: `apps/web/src/app/components/project-page/groupProjectSections.ts`
- Create: `apps/web/src/app/components/project-page/groupProjectSections.test.ts`

- [ ] **Step 1: Write the failing grouping tests**

Create `apps/web/src/app/components/project-page/groupProjectSections.test.ts`:

```ts
import assert from "node:assert/strict";

import { groupProjectSections } from "./groupProjectSections";
import type { PublishedProjectPageData } from "./ProjectPage";

type SectionRow = PublishedProjectPageData["sections"][number];

function sectionRow(id: string, type: SectionRow["section"]["type"]): SectionRow {
  return {
    primaryMediaAsset: null,
    posterMediaAsset: null,
    section: {
      body: null,
      caption: null,
      id,
      sortOrder: 0,
      title: id,
      type,
    },
  } satisfies SectionRow;
}

const grouped = groupProjectSections([
  sectionRow("intro", "text_block"),
  sectionRow("video-1", "parallax_video"),
  sectionRow("video-2", "parallax_video"),
  sectionRow("image", "image_block"),
  sectionRow("video-3", "parallax_video"),
]);

assert.deepEqual(
  grouped.map((group) => ({
    ids: group.sections.map((row) => row.section.id),
    type: group.type,
  })),
  [
    { ids: ["intro"], type: "single" },
    { ids: ["video-1", "video-2"], type: "parallax_sequence" },
    { ids: ["image"], type: "single" },
    { ids: ["video-3"], type: "single" },
  ],
);

assert.equal(grouped[1]?.key, "parallax-video-1-video-2");
assert.equal(groupProjectSections([]).length, 0);
```

- [ ] **Step 2: Run the grouping test and verify it fails**

Run: `npm --workspace apps/web exec tsx src/app/components/project-page/groupProjectSections.test.ts`

Expected: FAIL with a module resolution error because `groupProjectSections.ts` does not exist yet.

- [ ] **Step 3: Implement the grouping helper**

Create `apps/web/src/app/components/project-page/groupProjectSections.ts`:

```ts
import type { PublishedProjectPageData } from "./ProjectPage";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];

export type ProjectSectionRenderGroup =
  | {
      key: string;
      section: ProjectSectionRow;
      sections: [ProjectSectionRow];
      type: "single";
    }
  | {
      key: string;
      sections: ProjectSectionRow[];
      type: "parallax_sequence";
    };

export function groupProjectSections(
  sections: ProjectSectionRow[],
): ProjectSectionRenderGroup[] {
  const groups: ProjectSectionRenderGroup[] = [];
  let index = 0;

  while (index < sections.length) {
    const section = sections[index];

    if (section.section.type !== "parallax_video") {
      groups.push({ key: section.section.id, section, sections: [section], type: "single" });
      index += 1;
      continue;
    }

    const sequence: ProjectSectionRow[] = [];

    while (sections[index]?.section.type === "parallax_video") {
      sequence.push(sections[index]);
      index += 1;
    }

    if (sequence.length === 1) {
      const [singleSection] = sequence;
      groups.push({
        key: singleSection.section.id,
        section: singleSection,
        sections: [singleSection],
        type: "single",
      });
      continue;
    }

    groups.push({
      key: `parallax-${sequence.map((row) => row.section.id).join("-")}`,
      sections: sequence,
      type: "parallax_sequence",
    });
  }

  return groups;
}
```

- [ ] **Step 4: Run the grouping test and verify it passes**

Run: `npm --workspace apps/web exec tsx src/app/components/project-page/groupProjectSections.test.ts`

Expected: PASS with no assertion output.

- [ ] **Step 5: Commit grouping helper**

```bash
git add apps/web/src/app/components/project-page/groupProjectSections.ts apps/web/src/app/components/project-page/groupProjectSections.test.ts
git commit -m "feat: group consecutive parallax sections"
```

### Task 2: Share Scrub Scroll Height Calculation

**Files:**
- Create: `apps/web/src/app/components/scrollVideoScrub.ts`
- Modify: `apps/web/src/app/components/ScrollVideoParallax.tsx`

- [ ] **Step 1: Create shared scrub helper**

Create `apps/web/src/app/components/scrollVideoScrub.ts`:

```ts
export const MIN_SCROLL_HEIGHT_SVH = 260;
export const MAX_SCROLL_HEIGHT_SVH = 600;
export const SCROLL_HEIGHT_PER_SECOND_SVH = 55;

export function getScrubScrollHeightSvh(durationSeconds: number) {
  return Math.min(
    Math.max(durationSeconds * SCROLL_HEIGHT_PER_SECOND_SVH, MIN_SCROLL_HEIGHT_SVH),
    MAX_SCROLL_HEIGHT_SVH,
  );
}
```

- [ ] **Step 2: Update `ScrollVideoParallax` to use shared helper**

In `apps/web/src/app/components/ScrollVideoParallax.tsx`, replace the local constants with this import:

```ts
import { getScrubScrollHeightSvh } from "./scrollVideoScrub";
```

Then replace the inline scroll-height calculation inside `syncDuration` with:

```ts
const scrollHeight = getScrubScrollHeightSvh(video.duration);
```

- [ ] **Step 3: Run lint after helper extraction**

Run: `npm run lint`

Expected: PASS with no ESLint errors.

- [ ] **Step 4: Commit shared helper**

```bash
git add apps/web/src/app/components/scrollVideoScrub.ts apps/web/src/app/components/ScrollVideoParallax.tsx
git commit -m "refactor: share scrub scroll height calculation"
```

### Task 3: Add Parallax Video Sequence Component

**Files:**
- Create: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`
- Modify: `apps/web/src/app/components/project-page/parallax-transition.test.ts`

- [ ] **Step 1: Extend transition test before implementation**

Append to `apps/web/src/app/components/project-page/parallax-transition.test.ts`:

```ts
const sequenceSource = readFileSync(
  join(currentDir, "section-renderers", "ParallaxVideoSequence.tsx"),
  "utf8",
);

assert.match(
  sequenceSource,
  /className="project-scroll-range project-scrub-flow project-parallax-sequence/,
  "consecutive parallax videos should share one outer scroll range",
);

assert.match(
  sequenceSource,
  /className="project-scroll-stage sticky top-0 min-h-svh overflow-hidden"/,
  "consecutive parallax videos should share one sticky viewport stage",
);

assert.doesNotMatch(
  sequenceSource,
  /margin-top:\s*-\d+svh/,
  "parallax video sequences should not use negative margins",
);
```

- [ ] **Step 2: Run transition test and verify it fails**

Run: `npm --workspace apps/web exec tsx src/app/components/project-page/parallax-transition.test.ts`

Expected: FAIL because `ParallaxVideoSequence.tsx` does not exist yet.

- [ ] **Step 3: Implement sequence component**

Create `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`:

```tsx
"use client";

import { useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { ProjectScrollMedia } from "../../ProjectScrollMedia";
import { getScrubScrollHeightSvh } from "../../scrollVideoScrub";
import type { PublishedProjectPageData } from "../ProjectPage";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];

type ParallaxVideoSequenceProps = {
  sectionRows: ProjectSectionRow[];
};

const FALLBACK_SEGMENT_HEIGHT_SVH = getScrubScrollHeightSvh(0);

export function ParallaxVideoSequence({ sectionRows }: ParallaxVideoSequenceProps) {
  const rangeRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [segmentHeights, setSegmentHeights] = useState(
    sectionRows.map(() => FALLBACK_SEGMENT_HEIGHT_SVH),
  );
  const { scrollYProgress } = useScroll({
    target: rangeRef,
    offset: ["start start", "end end"],
  });
  const activeSectionRow = sectionRows[activeIndex] ?? sectionRows[0];
  const totalScrollHeight = segmentHeights.reduce((total, height) => total + height, 0);

  useEffect(() => {
    rangeRef.current?.style.setProperty("--scrub-scroll-height", `${totalScrollHeight}svh`);

    return () => {
      rangeRef.current?.style.removeProperty("--scrub-scroll-height");
    };
  }, [totalScrollHeight]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const scrollPosition = clampedProgress * totalScrollHeight;
    let traversedHeight = 0;

    for (let index = 0; index < segmentHeights.length; index += 1) {
      traversedHeight += segmentHeights[index];

      if (scrollPosition <= traversedHeight || index === segmentHeights.length - 1) {
        setActiveIndex(index);
        return;
      }
    }
  });

  if (!activeSectionRow) {
    return null;
  }

  const { section, primaryMediaAsset, posterMediaAsset } = activeSectionRow;
  const mediaAlt =
    posterMediaAsset?.altText ?? primaryMediaAsset?.altText ?? section.title ?? "Video do projeto.";

  return (
    <section
      aria-labelledby={section.title ? `${section.id}-title` : undefined}
      className="project-scroll-range project-scrub-flow project-parallax-sequence relative bg-[var(--black)] text-white"
      data-header-theme="light"
      ref={rangeRef}
    >
      <div className="project-scroll-stage sticky top-0 min-h-svh overflow-hidden">
        <ProjectScrollMedia
          alt={mediaAlt}
          key={section.id}
          onDurationChange={(durationSeconds) => {
            setSegmentHeights((currentHeights) => {
              const nextHeights = [...currentHeights];
              nextHeights[activeIndex] = getScrubScrollHeightSvh(durationSeconds);
              return nextHeights;
            });
          }}
          posterSrc={posterMediaAsset?.url ?? null}
          scrollRangeClassName="project-scroll-range"
          title={section.title ?? "Projeto"}
          videoMimeType={primaryMediaAsset?.mimeType ?? null}
          videoSrc={primaryMediaAsset?.url ?? null}
        />
        <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(90deg,rgb(0_0_0/0.58)_0%,rgb(0_0_0/0.22)_40%,transparent_72%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2 bg-[linear-gradient(0deg,rgb(0_0_0/0.56)_0%,transparent_68%)]" />

        <div className="relative z-30 mx-auto grid min-h-svh max-w-[1440px] grid-cols-4 content-end gap-4 px-5 pb-10 pt-28 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-16 lg:pb-16">
          <div className="col-span-4 sm:col-span-5 lg:col-span-6">
            {section.title ? (
              <h2
                className="font-[var(--font-display)] text-[var(--text-h1)] font-normal leading-[0.95] tracking-[-0.045em]"
                id={`${section.id}-title`}
              >
                {section.title}
              </h2>
            ) : null}
            {section.body ? (
              <p className="mt-6 max-w-2xl whitespace-pre-line text-[var(--text-body-lg)] leading-[1.55] text-white/76">
                {section.body}
              </p>
            ) : null}
          </div>
          {section.caption ? (
            <p className="col-span-4 mt-10 border-t border-white/20 pt-4 text-sm leading-6 text-white/60 sm:col-span-3 lg:col-span-3 lg:col-start-10 lg:mt-0">
              {section.caption}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add duration callback support to media components**

In `apps/web/src/app/components/ProjectScrollMedia.tsx`, add `onDurationChange?: (durationSeconds: number) => void;` to `ProjectScrollMediaProps`, destructure it, and pass it to `ScrollVideoParallax`:

```tsx
<ScrollVideoParallax
  alt={alt}
  className={className}
  onDurationChange={onDurationChange}
  onVideoError={() => setVideoFailed(true)}
  scrollRangeClassName={scrollRangeClassName}
  title={title}
  videoMimeType={videoMimeType}
  videoSrc={videoSrc}
/>
```

In `apps/web/src/app/components/ScrollVideoParallax.tsx`, add `onDurationChange?: (durationSeconds: number) => void;` to props, destructure it, and call it inside `syncDuration` after `durationRef.current = video.duration;`:

```ts
onDurationChange?.(video.duration);
```

Update the effect dependency array from `[isNearViewport]` to `[isNearViewport, onDurationChange]`.

- [ ] **Step 5: Run lint and transition test**

Run: `npm run lint`

Expected: PASS with no ESLint errors.

Run: `npm --workspace apps/web exec tsx src/app/components/project-page/parallax-transition.test.ts`

Expected: PASS with no assertion output.

- [ ] **Step 6: Commit sequence component**

```bash
git add apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx apps/web/src/app/components/project-page/parallax-transition.test.ts apps/web/src/app/components/ProjectScrollMedia.tsx apps/web/src/app/components/ScrollVideoParallax.tsx
git commit -m "feat: add consecutive parallax sequence component"
```

### Task 4: Render Groups In Project Page

**Files:**
- Modify: `apps/web/src/app/components/project-page/ProjectPage.tsx`

- [ ] **Step 1: Update `ProjectPage` to use render groups**

Modify imports in `apps/web/src/app/components/project-page/ProjectPage.tsx`:

```ts
import { groupProjectSections } from "./groupProjectSections";
import { ProjectHero } from "./ProjectHero";
import { ProjectPreloader } from "./ProjectPreloader";
import { ProjectSectionRenderer } from "./ProjectSectionRenderer";
import { ParallaxVideoSequence } from "./section-renderers/ParallaxVideoSequence";
```

Add render groups after `renderedSections`:

```ts
const renderGroups = groupProjectSections(renderedSections);
```

Replace the article map with:

```tsx
{renderGroups.map((group) => {
  if (group.type === "parallax_sequence") {
    return <ParallaxVideoSequence key={group.key} sectionRows={group.sections} />;
  }

  return (
    <ProjectSectionRenderer
      key={group.key}
      overlapPrevious={false}
      project={data.project}
      sectionRow={group.section}
    />
  );
})}
```

Keep `sectionCount={renderedSections.length}` unchanged so the hero still reports the real number of content sections.

- [ ] **Step 2: Run grouping and transition tests**

Run: `npm --workspace apps/web exec tsx src/app/components/project-page/groupProjectSections.test.ts`

Expected: PASS with no assertion output.

Run: `npm --workspace apps/web exec tsx src/app/components/project-page/parallax-transition.test.ts`

Expected: PASS with no assertion output.

- [ ] **Step 3: Run full verification**

Run: `npm run lint`

Expected: PASS with no ESLint errors.

Run: `npm run build`

Expected: PASS with a successful Next.js production build.

- [ ] **Step 4: Commit project page integration**

```bash
git add apps/web/src/app/components/project-page/ProjectPage.tsx
git commit -m "feat: render grouped parallax video sequences"
```

### Task 5: Manual Behavior Check

**Files:**
- No code changes unless verification finds a defect.

- [ ] **Step 1: Start the web app**

Run: `npm run dev`

Expected: Next.js dev server starts successfully and prints a local URL.

- [ ] **Step 2: Verify desktop sticky sequence behavior**

Open a project page with two or more consecutive `parallax_video` sections. Scroll through the sequence and confirm the viewport stays fixed while each video completes its scrub and the page only moves down after the last grouped video.

- [ ] **Step 3: Verify non-consecutive behavior**

Open or configure a project page where `parallax_video`, `text_block`, and another `parallax_video` are separated by content. Confirm the separated videos do not share one sequence across the text block.

- [ ] **Step 4: Verify reduced motion or touch fallback**

Use browser devtools to emulate reduced motion or a touch/coarse pointer device. Confirm the content remains scrollable and does not trap the user inside the sequence.

- [ ] **Step 5: Commit any manual-check fixes**

If manual verification required fixes, commit only those files:

```bash
git add apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx apps/web/src/app/components/project-page/ProjectPage.tsx apps/web/src/app/components/ProjectScrollMedia.tsx apps/web/src/app/components/ScrollVideoParallax.tsx apps/web/src/app/globals.css
git commit -m "fix: polish parallax sequence behavior"
```

If manual verification required no fixes, do not create an empty commit.

## Self-Review

- Spec coverage: Tasks 1 and 4 implement consecutive grouping; Task 3 implements one sticky sequence stage; Task 2 preserves existing duration-based pacing; Task 5 covers manual desktop and fallback verification.
- Placeholder scan: This plan contains exact file paths, exact commands, concrete code snippets, and expected command outcomes.
- Type consistency: `ProjectSectionRow`, `ProjectSectionRenderGroup`, `ParallaxVideoSequence`, `onDurationChange`, and `getScrubScrollHeightSvh` are named consistently across tasks.
