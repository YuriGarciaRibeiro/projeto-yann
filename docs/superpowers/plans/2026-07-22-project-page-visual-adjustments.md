# Project Page Visual Adjustments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the project page feel lighter by using a smaller persistent logo, moderately smaller typography, and clean parallax videos without constant dark overlays.

**Architecture:** Keep the change local to existing project-page components. `ProjectPage` owns the persistent fixed logo, `ProjectHero` only owns hero media and text, parallax renderers stop adding full-screen dark overlays, and `globals.css` keeps the approved scale via Tailwind theme tokens.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4 theme tokens, Framer Motion, Node assertion tests that inspect source files.

---

## File Structure

- Modify `apps/web/src/app/components/project-page/parallax-transition.test.ts`: add source assertions for persistent logo ownership, hero logo removal, typography token scale, and parallax overlay removal.
- Modify `apps/web/src/app/components/project-page/ProjectPage.tsx`: import `Image` and render one fixed project logo header above the whole page.
- Modify `apps/web/src/app/components/project-page/ProjectHero.tsx`: remove the hero-only logo header and the unused `Image` import.
- Modify `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSection.tsx`: remove constant left and bottom dark overlays over parallax video media.
- Modify `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`: remove constant dark overlays from enhanced and fallback sequence rendering.
- Modify `apps/web/src/app/globals.css`: reduce project-facing text tokens moderately.

## Commands

- Run a focused source assertion test with `node --experimental-strip-types apps/web/src/app/components/project-page/parallax-transition.test.ts` from the repository root.
- Run lint with `npm run lint` from the repository root.
- Run build with `npm run build` from the repository root if lint passes.

---

### Task 1: Add Failing Source Assertions

**Files:**
- Modify: `apps/web/src/app/components/project-page/parallax-transition.test.ts`

- [ ] **Step 1: Add source reads for files under test**

Change the top source-read block to include `ProjectHero.tsx`, `ParallaxVideoSection.tsx`, and keep the existing reads.

```ts
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
```

- [ ] **Step 2: Add assertions for the fixed logo**

Place these assertions after the source-read block and before the existing assertions.

```ts
assert.match(
  projectPageSource,
  /import Image from "next\/image";/,
  "project pages should import Next Image for the persistent project logo",
);

assert.match(
  projectPageSource,
  /<header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-5 py-5 text-white sm:px-8 lg:px-16">/,
  "project pages should render a fixed header so the logo follows the full page",
);

assert.match(
  projectPageSource,
  /className="h-12 w-auto sm:h-14 lg:h-16"/,
  "the persistent logo should use the approved moderate smaller responsive scale",
);

assert.doesNotMatch(
  projectHeroSource,
  /src="\/logo\.png"/,
  "ProjectHero should not render a duplicate hero-only logo after ProjectPage owns the fixed header",
);
```

- [ ] **Step 3: Add assertions for typography token scale**

Place these assertions near the existing `globalsSource` assertions.

```ts
assert.match(
  globalsSource,
  /--text-hero-title: clamp\(3\.25rem, 7\.5vw, 6\.75rem\);/,
  "project hero title token should use the approved moderate smaller scale",
);

assert.match(
  globalsSource,
  /--text-project-title: clamp\(2\.25rem, 4\.25vw, 4\.25rem\);/,
  "project parallax title token should use the approved moderate smaller scale",
);

assert.match(
  globalsSource,
  /--text-body-large: clamp\(1rem, 1\.15vw, 1\.1875rem\);/,
  "large project body text should use the approved moderate smaller scale",
);

assert.match(
  globalsSource,
  /--text-caption: 0\.975rem;/,
  "project captions should use the approved moderate smaller scale",
);

assert.match(
  globalsSource,
  /--text-meta: 0\.875rem;/,
  "project metadata should use the approved moderate smaller scale",
);

assert.match(
  globalsSource,
  /--text-label: 0\.625rem;/,
  "project labels should use the approved moderate smaller scale",
);
```

- [ ] **Step 4: Add assertions for parallax overlay removal**

Place these assertions near the existing parallax sequence assertions.

```ts
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
  /\.project-scrub-flow::before[\s\S]*rgb\(5 5 5 \/ 0\.72\)/,
  "transition darkening between parallax blocks should remain in the project scrub flow before gradient",
);

assert.match(
  globalsSource,
  /\.project-scrub-flow::after[\s\S]*rgb\(5 5 5 \/ 0\.74\)/,
  "transition darkening between parallax blocks should remain in the project scrub flow after gradient",
);
```

- [ ] **Step 5: Run focused test and verify it fails**

Run:

```bash
node --experimental-strip-types apps/web/src/app/components/project-page/parallax-transition.test.ts
```

Expected: FAIL with an assertion mentioning the missing fixed header, unchanged typography token, or remaining parallax dark overlay.

- [ ] **Step 6: Commit failing test**

```bash
git add apps/web/src/app/components/project-page/parallax-transition.test.ts
git commit -m "test: cover project page visual adjustments"
```

---

### Task 2: Add Persistent Project Logo Header

**Files:**
- Modify: `apps/web/src/app/components/project-page/ProjectPage.tsx`
- Modify: `apps/web/src/app/components/project-page/ProjectHero.tsx`
- Test: `apps/web/src/app/components/project-page/parallax-transition.test.ts`

- [ ] **Step 1: Import Image in ProjectPage**

At the top of `ProjectPage.tsx`, add the import before local imports.

```ts
import Image from "next/image";
```

- [ ] **Step 2: Render fixed header in ProjectPage**

Inside `<main className="overflow-x-clip bg-paper text-ink">`, before `<ProjectHero data={data} />`, add this header.

```tsx
<header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-5 py-5 text-white sm:px-8 lg:px-16">
  <div className="pointer-events-auto mx-auto flex max-w-360 items-center justify-between gap-6">
    <a
      aria-label="Yann"
      className="block outline-offset-4 transition-opacity hover:opacity-65"
      href="#project-title"
    >
      <Image
        alt=""
        className="h-12 w-auto sm:h-14 lg:h-16"
        height={1598}
        priority
        src="/logo.png"
        unoptimized
        width={3554}
      />
    </a>
  </div>
</header>
```

- [ ] **Step 3: Remove duplicate hero logo header**

In `ProjectHero.tsx`, remove this import.

```ts
import Image from "next/image";
```

Then remove the full header block that currently starts with:

```tsx
<header className="pointer-events-none absolute inset-x-0 top-0 z-40 px-5 py-5 text-white sm:px-8 lg:px-16">
```

and ends with:

```tsx
</header>
```

- [ ] **Step 4: Run focused test for logo assertions**

Run:

```bash
node --experimental-strip-types apps/web/src/app/components/project-page/parallax-transition.test.ts
```

Expected: still FAIL because typography tokens and parallax overlays are not implemented yet. It should no longer fail on persistent logo assertions.

- [ ] **Step 5: Commit persistent logo change**

```bash
git add apps/web/src/app/components/project-page/ProjectPage.tsx apps/web/src/app/components/project-page/ProjectHero.tsx
git commit -m "fix: keep project logo fixed while scrolling"
```

---

### Task 3: Reduce Project Typography Scale

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Test: `apps/web/src/app/components/project-page/parallax-transition.test.ts`

- [ ] **Step 1: Update project-facing text tokens**

In `apps/web/src/app/globals.css`, replace the existing token values with these approved option B values.

```css
  --text-hero-title: clamp(3.25rem, 7.5vw, 6.75rem);
  --text-page-title: clamp(3.5rem, 12vw, 10rem);
  --text-project-title: clamp(2.25rem, 4.25vw, 4.25rem);
  --text-section-title: clamp(2.25rem, 4vw, 4rem);
  --text-card-title: clamp(1.75rem, 2.8vw, 2.75rem);
  --text-preloader-title: clamp(2.5rem, 12vw, 5.5rem);
  --text-body-large: clamp(1rem, 1.15vw, 1.1875rem);
  --text-body: clamp(1rem, 1.1vw, 1.125rem);
  --text-caption: 0.975rem;
  --text-meta: 0.875rem;
  --text-label: 0.625rem;
```

Keep admin tokens unchanged.

- [ ] **Step 2: Run focused test for typography assertions**

Run:

```bash
node --experimental-strip-types apps/web/src/app/components/project-page/parallax-transition.test.ts
```

Expected: still FAIL because parallax overlay removal is not implemented yet. It should no longer fail on typography token assertions.

- [ ] **Step 3: Commit typography scale change**

```bash
git add apps/web/src/app/globals.css
git commit -m "fix: reduce project page typography scale"
```

---

### Task 4: Remove Constant Parallax Video Dark Overlays

**Files:**
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`
- Test: `apps/web/src/app/components/project-page/parallax-transition.test.ts`

- [ ] **Step 1: Remove overlays from standalone parallax video sections**

In `ParallaxVideoSection.tsx`, delete these two elements after `<ProjectScrollMedia />`.

```tsx
<div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(90deg,rgb(0_0_0/0.58)_0%,rgb(0_0_0/0.22)_40%,transparent_72%)]" />
<div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2 bg-[linear-gradient(0deg,rgb(0_0_0/0.56)_0%,transparent_68%)]" />
```

- [ ] **Step 2: Remove overlays from fallback parallax video sequence**

In `ParallaxVideoSequence.tsx`, inside the fallback `article`, delete these two elements.

```tsx
<div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgb(0_0_0/0.62)_0%,rgb(0_0_0/0.28)_44%,transparent_76%)]" />
<div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/2 bg-[linear-gradient(0deg,rgb(0_0_0/0.6)_0%,transparent_68%)]" />
```

- [ ] **Step 3: Remove overlays from enhanced parallax video sequence**

In `ParallaxVideoSequence.tsx`, inside the sticky stage and before the progress indicator, delete these two elements.

```tsx
<div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(90deg,rgb(0_0_0/0.58)_0%,rgb(0_0_0/0.22)_40%,transparent_72%)]" />
<div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2 bg-[linear-gradient(0deg,rgb(0_0_0/0.56)_0%,transparent_68%)]" />
```

- [ ] **Step 4: Run focused test and verify it passes**

Run:

```bash
node --experimental-strip-types apps/web/src/app/components/project-page/parallax-transition.test.ts
```

Expected: PASS with no output.

- [ ] **Step 5: Commit overlay removal**

```bash
git add apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSection.tsx apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx
git commit -m "fix: remove constant parallax video dark overlays"
```

---

### Task 5: Final Verification

**Files:**
- Verify: all files changed by Tasks 1-4

- [ ] **Step 1: Run focused parallax transition test**

Run:

```bash
node --experimental-strip-types apps/web/src/app/components/project-page/parallax-transition.test.ts
```

Expected: PASS with no output.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS with ESLint completing without errors.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS with Next.js completing the production build.

- [ ] **Step 4: Inspect manually**

Run:

```bash
npm run dev
```

Open a published project page such as `http://localhost:3000/projetos/<slug>`.

Verify:

- The logo stays fixed at the top-left while scrolling through the full project page.
- The logo is smaller than before and does not duplicate in the hero.
- Hero and parallax text feels moderately smaller.
- Parallax videos no longer darken during playback.
- The only remaining darkening is the transition gradient between parallax blocks.

- [ ] **Step 5: Commit any final verification-only fixes**

If verification required code changes, commit only those changed files.

```bash
git status --short
git add <changed-files>
git commit -m "fix: polish project page visual adjustments"
```

If no changes were required, do not create an empty commit.

---

## Self-Review

- Spec coverage: Task 2 covers the persistent smaller logo, Task 3 covers moderate typography reduction, Task 4 covers parallax overlay removal while preserving `.project-scrub-flow` transition gradients, and Task 5 covers verification.
- Placeholder scan: no TBD, TODO, or open-ended implementation steps remain.
- Type consistency: all referenced files, class names, token names, and commands match the current codebase and spec.
