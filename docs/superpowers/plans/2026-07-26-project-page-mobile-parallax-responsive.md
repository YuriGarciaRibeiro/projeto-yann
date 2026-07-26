# Project Page Mobile Parallax Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the public project page on mobile while testing full parallax/sticky behavior on touch devices and keeping the behavior easy to change later.

**Architecture:** Keep the parallax toggle centralized in global CSS and one sequence enhancement media query. Use responsive utility changes in existing section components to improve mobile spacing, media proportions, and text readability without changing data flow. Preserve reduced-motion fallback as the only automatic opt-out from sticky/scrub behavior.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Framer Motion, native CSS media queries.

---

## File Structure

- Modify: `apps/web/src/app/globals.css`
  - Owns global parallax/sticky activation rules, reduced-motion opt-out, and mobile scroll-height variables.
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`
  - Owns whether grouped parallax sequences use enhanced sticky/scrub mode or fallback mode.
- Modify: `apps/web/src/app/components/project-page/ProjectHero.tsx`
  - Owns hero grid, title, metadata, subtitle spacing, and mobile overlay readability.
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSection.tsx`
  - Owns single parallax section overlay spacing and mobile readability.
- Modify: `apps/web/src/app/components/project-page/section-renderers/ImageBlockSection.tsx`
  - Owns image block mobile media height and caption/text rhythm.
- Modify: `apps/web/src/app/components/project-page/section-renderers/VideoBlockSection.tsx`
  - Owns video block mobile spacing and text rhythm.
- Modify: `apps/web/src/app/components/project-page/section-renderers/TextBlockSection.tsx`
  - Owns editorial text block mobile line length and spacing.
- Modify: `apps/web/src/app/components/project-page/section-renderers/TechnicalInfoSection.tsx`
  - Owns technical information mobile rhythm.
- Modify: `apps/web/src/app/components/project-page/section-renderers/ProjectContactCreditFooter.tsx`
  - Owns contact footer mobile spacing and long contact wrapping.

## Task 1: Centralize Mobile Parallax Activation

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`

- [ ] **Step 1: Inspect current touch opt-out points**

Run:

```bash
rg 'pointer: coarse|pointer: fine|prefers-reduced-motion|canEnhanceSequence' apps/web/src/app apps/web/src/lib
```

Expected: matches in `globals.css` and `ParallaxVideoSequence.tsx` showing that touch devices currently disable sticky/scrub behavior.

- [ ] **Step 2: Update global parallax CSS**

In `apps/web/src/app/globals.css`, replace the current parallax media-query block:

```css
@media (prefers-reduced-motion: no-preference) and (pointer: fine) {
  .hero-scroll-range:has(.scrub-media),
  .project-scroll-range:has(.scrub-media) {
    min-height: var(--scrub-scroll-height, 280svh);
  }

  .hero-scroll-stage,
  .project-scroll-stage {
    height: 100svh;
  }
}

@media (prefers-reduced-motion: reduce), (pointer: coarse) {
  .hero-scroll-stage,
  .project-scroll-stage {
    position: relative;
  }
}
```

with:

```css
@media (prefers-reduced-motion: no-preference) {
  .hero-scroll-range:has(.scrub-media),
  .project-scroll-range:has(.scrub-media) {
    min-height: var(--scrub-scroll-height, var(--project-mobile-scrub-scroll-height, 280svh));
  }

  .hero-scroll-stage,
  .project-scroll-stage {
    height: var(--project-scroll-stage-height, 100svh);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-scroll-stage,
  .project-scroll-stage {
    position: relative;
  }
}
```

Then add these variables inside `:root` after `--foreground`:

```css
  --project-mobile-scrub-scroll-height: 280svh;
  --project-scroll-stage-height: 100svh;
```

- [ ] **Step 3: Enable parallax sequence enhancement on touch devices**

In `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`, replace:

```ts
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: no-preference) and (pointer: fine)",
    );
```

with:

```ts
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: no-preference)");
```

- [ ] **Step 4: Verify the touch opt-out is gone but reduced-motion remains**

Run:

```bash
rg 'pointer: coarse|pointer: fine' apps/web/src/app/components/project-page apps/web/src/app/globals.css
```

Expected: no matches in project page components or `globals.css`.

Run:

```bash
rg 'prefers-reduced-motion: reduce|prefers-reduced-motion: no-preference' apps/web/src/app/globals.css apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx
```

Expected: matches remain for both reduced-motion CSS and no-preference enhancement logic.

- [ ] **Step 5: Optional commit if explicitly authorized**

Only run this if the user has explicitly asked for commits:

```bash
git add apps/web/src/app/globals.css apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx
git commit -m "feat: enable mobile project parallax test"
```

## Task 2: Improve Hero Mobile Composition

**Files:**
- Modify: `apps/web/src/app/components/project-page/ProjectHero.tsx`

- [ ] **Step 1: Update hero overlay spacing and readable mobile title sizing**

In `apps/web/src/app/components/project-page/ProjectHero.tsx`, replace the `motion.div` className and inner text classes with:

```tsx
        <motion.div
          className="relative z-30 grid min-h-svh max-w-none grid-cols-4 content-end items-end gap-4 px-5 pb-8 pt-24 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-8 lg:pb-16 xl:px-10"
          style={{ y: contentY }}
        >
          <div className="col-span-4 self-end sm:col-span-5 lg:col-span-7">
            {heroMetadata.length > 0 ? (
              <p className="max-w-[92vw] text-label font-medium uppercase leading-[1.55] tracking-[0.16em] text-white/70 [text-shadow:0_2px_18px_rgb(0_0_0/0.55)]">
                {heroMetadata.join(" / ")}
              </p>
            ) : null}
            <h1
              className="mt-4 max-w-[92vw] font-display text-hero-title font-normal leading-[0.86] tracking-[-0.055em] [text-wrap:balance] [text-shadow:0_2px_22px_rgb(0_0_0/0.48)] sm:mt-5 lg:leading-[0.88] lg:tracking-[-0.045em]"
              id="project-title"
            >
              {project.title}
            </h1>
            {project.subtitle ? (
              <p className="mt-5 max-w-[34rem] text-body-large leading-[1.6] text-white/80 [text-shadow:0_2px_18px_rgb(0_0_0/0.45)] sm:mt-6">
                {project.subtitle}
              </p>
            ) : null}
          </div>
        </motion.div>
```

- [ ] **Step 2: Verify TypeScript/JSX syntax through lint**

Run:

```bash
npm --workspace @paralax/web run lint
```

Expected: lint completes without syntax errors from `ProjectHero.tsx`.

- [ ] **Step 3: Optional commit if explicitly authorized**

Only run this if the user has explicitly asked for commits:

```bash
git add apps/web/src/app/components/project-page/ProjectHero.tsx
git commit -m "style: refine mobile project hero"
```

## Task 3: Improve Parallax Overlay Mobile Readability

**Files:**
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`

- [ ] **Step 1: Update single parallax section overlay classes**

In `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSection.tsx`, replace the overlay grid block beginning with:

```tsx
        <div className="relative z-30 grid min-h-svh max-w-none grid-cols-4 content-end gap-4 px-5 pb-10 pt-28 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-8 lg:pb-16 xl:px-10">
```

through the caption paragraph with:

```tsx
        <div className="relative z-30 grid min-h-svh max-w-none grid-cols-4 content-end gap-4 px-5 pb-8 pt-24 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-8 lg:pb-16 xl:px-10">
          <div className="col-span-4 [text-shadow:0_2px_18px_rgb(0_0_0/0.55)] sm:col-span-5 lg:col-span-6">
            {section.title ? (
              <h2
                className="max-w-[92vw] font-display text-project-title font-normal leading-[0.92] tracking-[-0.05em] [text-wrap:balance] lg:leading-[0.95] lg:tracking-[-0.045em]"
                id={`${section.id}-title`}
              >
                {section.title}
              </h2>
            ) : null}
            {section.body ? (
              <p className="mt-5 max-w-[34rem] whitespace-pre-line text-body-large leading-[1.62] text-white/78 sm:mt-6">
                {section.body}
              </p>
            ) : null}
          </div>
          {section.caption ? (
            <p className="col-span-4 mt-8 max-w-[34rem] self-end border border-white/10 bg-black/24 px-4 py-3 text-caption leading-6 text-white/74 backdrop-blur-[1px] sm:col-span-3 lg:col-span-3 lg:col-start-10 lg:mt-0 xl:col-start-10">
              {section.caption}
            </p>
          ) : null}
        </div>
```

- [ ] **Step 2: Update fallback sequence overlay classes**

In `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`, inside the fallback branch, replace the article overlay grid block beginning with:

```tsx
              <div className="relative z-20 grid min-h-svh max-w-none grid-cols-4 content-end gap-4 px-5 pb-10 pt-28 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-8 lg:pb-16 xl:px-10">
```

through the caption paragraph with the same class structure used in Step 1, keeping `z-20` instead of `z-30`:

```tsx
              <div className="relative z-20 grid min-h-svh max-w-none grid-cols-4 content-end gap-4 px-5 pb-8 pt-24 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-8 lg:pb-16 xl:px-10">
                <div className="col-span-4 [text-shadow:0_2px_18px_rgb(0_0_0/0.55)] sm:col-span-5 lg:col-span-6">
                  {section.title ? (
                    <h2
                      className="max-w-[92vw] font-display text-project-title font-normal leading-[0.92] tracking-[-0.05em] [text-wrap:balance] lg:leading-[0.95] lg:tracking-[-0.045em]"
                      id={`${section.id}-title`}
                    >
                      {section.title}
                    </h2>
                  ) : null}
                  {section.body ? (
                    <p className="mt-5 max-w-[34rem] whitespace-pre-line text-body-large leading-[1.62] text-white/78 sm:mt-6">
                      {section.body}
                    </p>
                  ) : null}
                </div>
                {section.caption ? (
                  <p className="col-span-4 mt-8 max-w-[34rem] self-end border border-white/10 bg-black/24 px-4 py-3 text-caption leading-6 text-white/74 backdrop-blur-[1px] sm:col-span-3 lg:col-span-3 lg:col-start-10 lg:mt-0 xl:col-start-10">
                    {section.caption}
                  </p>
                ) : null}
              </div>
```

- [ ] **Step 3: Update enhanced sequence overlay classes**

In `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`, inside the enhanced branch, replace the `motion.div` className and inner title/body/caption classes with:

```tsx
            className="relative z-30 grid min-h-svh max-w-none grid-cols-4 content-end gap-4 px-5 pb-8 pt-24 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-8 lg:pb-16 xl:px-10"
```

Use these classes for the title, body, and caption in that block:

```tsx
className="max-w-[92vw] font-display text-project-title font-normal leading-[0.92] tracking-[-0.05em] [text-wrap:balance] lg:leading-[0.95] lg:tracking-[-0.045em]"
```

```tsx
className="mt-5 max-w-[34rem] whitespace-pre-line text-body-large leading-[1.62] text-white/78 sm:mt-6"
```

```tsx
className="col-span-4 mt-8 max-w-[34rem] self-end border border-white/10 bg-black/24 px-4 py-3 text-caption leading-6 text-white/74 backdrop-blur-[1px] sm:col-span-3 lg:col-span-3 lg:col-start-10 lg:mt-0 xl:col-start-10"
```

- [ ] **Step 4: Run lint**

Run:

```bash
npm --workspace @paralax/web run lint
```

Expected: lint passes.

- [ ] **Step 5: Optional commit if explicitly authorized**

Only run this if the user has explicitly asked for commits:

```bash
git add apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSection.tsx apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx
git commit -m "style: improve mobile parallax overlays"
```

## Task 4: Improve Non-Parallax Section Mobile Rhythm

**Files:**
- Modify: `apps/web/src/app/components/project-page/section-renderers/ImageBlockSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/VideoBlockSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/TextBlockSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/TechnicalInfoSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ProjectContactCreditFooter.tsx`

- [ ] **Step 1: Update image block mobile spacing and media height**

In `ImageBlockSection.tsx`, replace the section class:

```tsx
className="bg-paper px-5 py-16 text-ink sm:px-8 sm:py-24 lg:px-16"
```

with:

```tsx
className="bg-paper px-5 py-14 text-ink sm:px-8 sm:py-24 lg:px-16"
```

Replace image and placeholder classes:

```tsx
className="min-h-[55svh] w-full object-cover"
placeholderClassName="min-h-[55svh] w-full"
```

with:

```tsx
className="min-h-[42svh] w-full object-cover sm:min-h-[55svh]"
placeholderClassName="min-h-[42svh] w-full sm:min-h-[55svh]"
```

Replace the metadata grid class:

```tsx
className="mt-6 grid gap-4 border-t border-line pt-5 lg:grid-cols-12"
```

with:

```tsx
className="mt-5 grid gap-4 border-t border-line pt-5 sm:mt-6 lg:grid-cols-12"
```

- [ ] **Step 2: Update video block mobile spacing**

In `VideoBlockSection.tsx`, replace the section class:

```tsx
className="bg-black px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-16"
```

with:

```tsx
className="bg-black px-5 py-16 text-white sm:px-8 sm:py-28 lg:px-16"
```

Replace `SectionText` wrapper class:

```tsx
className="mt-6 grid gap-4 border-t border-white/18 pt-5 lg:grid-cols-8"
```

with:

```tsx
className="mt-5 grid gap-4 border-t border-white/18 pt-5 sm:mt-6 lg:grid-cols-8"
```

Replace body/caption container class:

```tsx
className="text-caption leading-6 text-white/68 lg:col-span-4 lg:col-start-5"
```

with:

```tsx
className="max-w-[34rem] text-caption leading-6 text-white/70 lg:col-span-4 lg:col-start-5"
```

- [ ] **Step 3: Update text block mobile rhythm**

In `TextBlockSection.tsx`, replace section class:

```tsx
className="bg-paper px-5 py-20 text-ink sm:px-8 sm:py-28 lg:px-16"
```

with:

```tsx
className="bg-paper px-5 py-16 text-ink sm:px-8 sm:py-28 lg:px-16"
```

Replace body paragraph class:

```tsx
className="max-w-3xl whitespace-pre-line text-body-large leading-[1.65] text-graphite lg:col-span-5 lg:col-start-8"
```

with:

```tsx
className="max-w-[38rem] whitespace-pre-line text-body-large leading-[1.7] text-graphite lg:col-span-5 lg:col-start-8"
```

- [ ] **Step 4: Update technical info mobile rhythm**

In `TechnicalInfoSection.tsx`, replace section class:

```tsx
className="bg-white px-5 py-20 text-ink sm:px-8 sm:py-28 lg:px-16"
```

with:

```tsx
className="bg-white px-5 py-16 text-ink sm:px-8 sm:py-28 lg:px-16"
```

Replace facts row class:

```tsx
className="grid gap-2 border-b border-line py-4 sm:grid-cols-[12rem_1fr] sm:gap-6"
```

with:

```tsx
className="grid gap-2 border-b border-line py-4 sm:grid-cols-[12rem_1fr] sm:gap-6"
```

No code change is needed for the facts row if it already matches; confirm it remains single-column before `sm`.

- [ ] **Step 5: Update contact footer wrapping and mobile spacing**

In `ProjectContactCreditFooter.tsx`, replace footer class:

```tsx
className="bg-ink px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-16"
```

with:

```tsx
className="bg-ink px-5 py-16 text-white sm:px-8 sm:py-28 lg:px-16"
```

Replace contact value class:

```tsx
className="text-meta leading-6 text-white/72"
```

with:

```tsx
className="break-words text-meta leading-6 text-white/72"
```

- [ ] **Step 6: Run lint**

Run:

```bash
npm --workspace @paralax/web run lint
```

Expected: lint passes.

- [ ] **Step 7: Optional commit if explicitly authorized**

Only run this if the user has explicitly asked for commits:

```bash
git add apps/web/src/app/components/project-page/section-renderers/ImageBlockSection.tsx apps/web/src/app/components/project-page/section-renderers/VideoBlockSection.tsx apps/web/src/app/components/project-page/section-renderers/TextBlockSection.tsx apps/web/src/app/components/project-page/section-renderers/TechnicalInfoSection.tsx apps/web/src/app/components/project-page/section-renderers/ProjectContactCreditFooter.tsx
git commit -m "style: refine mobile project sections"
```

## Task 5: Final Verification

**Files:**
- Verify: public project page implementation files from Tasks 1-4.

- [ ] **Step 1: Run lint**

Run:

```bash
npm --workspace @paralax/web run lint
```

Expected: lint passes.

- [ ] **Step 2: Build the web app**

Run:

```bash
npm --workspace @paralax/web run build
```

Expected: Next.js build completes successfully.

- [ ] **Step 3: Manual mobile browser verification**

Run:

```bash
npm --workspace @paralax/web run dev
```

Open a published project route such as:

```text
http://localhost:3000/projetos/<published-project-slug>
```

Use a mobile viewport around 390px wide. Confirm:

- Hero sticky/parallax behavior is active when reduced motion is not enabled.
- Single parallax video sections stay sticky and scrub through the scroll range.
- Consecutive parallax video sequences use enhanced sequence mode instead of fallback mode.
- Text overlays remain readable on media.
- Image/video/text/technical/contact sections have no horizontal overflow.
- Long contact links wrap instead of pushing the viewport sideways.

- [ ] **Step 4: Manual reduced-motion verification**

In browser devtools or OS accessibility settings, emulate `prefers-reduced-motion: reduce`. Reload the project route and confirm:

- `.hero-scroll-stage` and `.project-scroll-stage` no longer behave sticky.
- The page remains navigable in normal flow.
- Media fallback/poster content remains visible if video is not scrubbed.

- [ ] **Step 5: Record final status**

In the final response, report:

```text
Implemented mobile full-parallax test for public project pages.
Verification run: npm --workspace @paralax/web run lint [pass/fail]
Verification run: npm --workspace @paralax/web run build [pass/fail]
Manual mobile/reduced-motion checks: [performed/not performed and why]
```

- [ ] **Step 6: Optional commit if explicitly authorized**

Only run this if the user has explicitly asked for commits and previous tasks were not committed individually:

```bash
git add apps/web/src/app/globals.css apps/web/src/app/components/project-page/ProjectHero.tsx apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSection.tsx apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx apps/web/src/app/components/project-page/section-renderers/ImageBlockSection.tsx apps/web/src/app/components/project-page/section-renderers/VideoBlockSection.tsx apps/web/src/app/components/project-page/section-renderers/TextBlockSection.tsx apps/web/src/app/components/project-page/section-renderers/TechnicalInfoSection.tsx apps/web/src/app/components/project-page/section-renderers/ProjectContactCreditFooter.tsx docs/superpowers/specs/2026-07-26-project-page-mobile-parallax-responsive-design.md docs/superpowers/plans/2026-07-26-project-page-mobile-parallax-responsive.md
git commit -m "feat: improve mobile project parallax responsiveness"
```

## Self-Review

- Spec coverage: Tasks 1 and 3 cover mobile parallax activation and centralized reduced-motion behavior. Tasks 2 and 4 cover full-page responsive improvements for hero and all public section types. Task 5 covers lint, build, manual mobile verification, reduced-motion verification, and overflow checks.
- Placeholder scan: The plan contains no TBD/TODO placeholders and includes exact paths, code replacements, commands, and expected results.
- Type consistency: No new exported types or APIs are introduced. Existing component props and data fields remain unchanged.
