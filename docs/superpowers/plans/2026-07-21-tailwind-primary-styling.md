# Tailwind Primary Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Tailwind the primary styling interface in the web app while reducing `globals.css` to theme tokens and true global behavior.

**Architecture:** Keep the current Tailwind 4 CSS-first setup. Expand `@theme inline` in `globals.css` so app classes can use named utilities such as `bg-paper`, `text-ink`, `border-line`, `font-display`, and `text-body`, then migrate JSX class names away from repeated `var(...)` arbitrary utilities. Keep scroll/video global selectors in CSS because they rely on shared classes, pseudo-elements, media queries, and `:has()`.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript 5, Tailwind CSS 4, `@tailwindcss/postcss`.

---

## File Structure

- Modify: `apps/web/src/app/globals.css` for Tailwind 4 theme tokens and global-only CSS.
- Modify: `apps/web/src/app/page.tsx` for homepage Tailwind token utilities.
- Modify: `apps/web/src/app/projetos/[slug]/not-found.tsx` for project not-found Tailwind token utilities.
- Modify: `apps/web/src/app/components/ProjectScrollMedia.tsx` for media fallback color/text utilities.
- Modify: `apps/web/src/app/components/project-page/ProjectHero.tsx` for hero typography/color utilities.
- Modify: `apps/web/src/app/components/project-page/ProjectMediaFallback.tsx` for fallback typography/color utilities.
- Modify: `apps/web/src/app/components/project-page/ProjectPage.tsx` for page-level token utilities.
- Modify: `apps/web/src/app/components/project-page/ProjectPreloader.tsx` for preloader token utilities.
- Modify: `apps/web/src/app/components/project-page/section-renderers/TextBlockSection.tsx` for editorial text section utilities.
- Modify: `apps/web/src/app/components/project-page/section-renderers/ImageBlockSection.tsx` for image section utilities.
- Modify: `apps/web/src/app/components/project-page/section-renderers/VideoBlockSection.tsx` for video section utilities.
- Modify: `apps/web/src/app/components/project-page/section-renderers/TechnicalInfoSection.tsx` for technical-info utilities.
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSection.tsx` for parallax section utilities.
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx` for sequence section utilities.
- Modify: `apps/web/src/app/components/project-page/section-renderers/ProjectContactCreditFooter.tsx` for footer utilities.
- Modify: `apps/web/src/app/admin/page.tsx` for admin index typography utilities.
- Modify: `apps/web/src/app/admin/login/page.tsx` for login typography utilities.
- Modify: `apps/web/src/app/admin/projetos/[id]/page.tsx` for edit page typography utilities.
- Modify: `apps/web/src/app/admin/projetos/novo/page.tsx` for create page typography utilities.
- Modify: `apps/web/src/app/admin/components/AdminShell.tsx` for admin shell typography utilities.
- Modify: `apps/web/src/app/admin/components/DeleteProjectForm.tsx` for danger-zone typography utilities.
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx` for upload field typography utilities.
- Modify: `apps/web/src/app/admin/components/ProjectForm.tsx` for form typography utilities.
- Modify: `apps/web/src/app/admin/components/ProjectSectionForm.tsx` for section form typography utilities.
- Modify: `apps/web/src/app/admin/components/ProjectSectionsEditor.tsx` for editor typography utilities.

## Task 1: Verify Framework And Baseline

**Files:**
- Read: `AGENTS.md`
- Read: `apps/web/package.json`
- Read: `apps/web/postcss.config.mjs`
- Read: `apps/web/src/app/globals.css`

- [ ] **Step 1: Confirm local Next docs availability**

Run:

```bash
rg -l "Tailwind|CSS|PostCSS" node_modules/next/dist/docs apps/web/node_modules/next/dist/docs
```

Expected: If docs exist, read relevant CSS/PostCSS/App Router docs before editing. If both paths are missing, record that `node_modules/next/dist/docs` is unavailable and keep edits limited to CSS theme tokens and JSX class names.

- [ ] **Step 2: Run baseline lint**

Run:

```bash
npm run lint:web
```

Expected: PASS, or record existing lint failures before changing files.

- [ ] **Step 3: Run baseline build**

Run:

```bash
npm run build:web
```

Expected: PASS, or record existing build failures before changing files.

## Task 2: Promote Design Tokens Into Tailwind Theme Utilities

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Replace the current root/theme token block with Tailwind-readable tokens**

In `apps/web/src/app/globals.css`, keep the existing `:root` values and expand `@theme inline` to this shape:

```css
@import "tailwindcss";

:root {
  --black: #050505;
  --ink: #101010;
  --charcoal: #1c1c1c;
  --graphite: #3f3f3f;
  --mid-gray: #777777;
  --silver: #b7b7b7;
  --line: #d8d8d8;
  --paper: #f4f4f2;
  --white: #ffffff;
  --background: var(--paper);
  --foreground: var(--ink);

  --font-display: Georgia, "Times New Roman", serif;
  --font-sans: var(--font-geist-sans), Arial, sans-serif;

  --text-hero-title: clamp(4rem, 10vw, 9rem);
  --text-page-title: clamp(3.5rem, 12vw, 10rem);
  --text-project-title: clamp(2.75rem, 5.5vw, 50.5rem);
  --text-section-title: clamp(2.25rem, 4vw, 4rem);
  --text-card-title: clamp(1.75rem, 2.8vw, 2.75rem);
  --text-preloader-title: clamp(2.5rem, 12vw, 5.5rem);
  --text-body-large: clamp(1.125rem, 1.4vw, 1.375rem);
  --text-body: clamp(1rem, 1.1vw, 1.125rem);
  --text-caption: 0.875rem;
  --text-meta: 0.875rem;
  --text-label: 0.75rem;
  --text-admin-title: clamp(2.25rem, 6vw, 3.75rem);
  --text-admin-page-title: 2.25rem;
  --text-admin-section-title: 1.25rem;
  --text-admin-card-title: 1.875rem;
  --text-admin-body: 0.875rem;
  --text-admin-label: 0.875rem;
  --text-admin-help: 0.75rem;
  --text-admin-control: 1rem;

  --duration-fast: 220ms;
  --duration-base: 360ms;
  --ease-editorial: cubic-bezier(0.22, 1, 0.36, 1);
}

@theme inline {
  --color-black: #050505;
  --color-ink: #101010;
  --color-charcoal: #1c1c1c;
  --color-graphite: #3f3f3f;
  --color-mid-gray: #777777;
  --color-silver: #b7b7b7;
  --color-line: #d8d8d8;
  --color-paper: #f4f4f2;
  --color-white: #ffffff;
  --color-background: var(--background);
  --color-foreground: var(--foreground);

  --font-display: Georgia, "Times New Roman", serif;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  --text-hero-title: clamp(4rem, 10vw, 9rem);
  --text-page-title: clamp(3.5rem, 12vw, 10rem);
  --text-project-title: clamp(2.75rem, 5.5vw, 50.5rem);
  --text-section-title: clamp(2.25rem, 4vw, 4rem);
  --text-card-title: clamp(1.75rem, 2.8vw, 2.75rem);
  --text-preloader-title: clamp(2.5rem, 12vw, 5.5rem);
  --text-body-large: clamp(1.125rem, 1.4vw, 1.375rem);
  --text-body: clamp(1rem, 1.1vw, 1.125rem);
  --text-caption: 0.875rem;
  --text-meta: 0.875rem;
  --text-label: 0.75rem;
  --text-admin-title: clamp(2.25rem, 6vw, 3.75rem);
  --text-admin-page-title: 2.25rem;
  --text-admin-section-title: 1.25rem;
  --text-admin-card-title: 1.875rem;
  --text-admin-body: 0.875rem;
  --text-admin-label: 0.875rem;
  --text-admin-help: 0.75rem;
  --text-admin-control: 1rem;

  --ease-editorial: cubic-bezier(0.22, 1, 0.36, 1);
}
```

- [ ] **Step 2: Remove alias tokens that duplicate Tailwind utilities**

Delete these alias declarations from `:root` after confirming no JSX still uses them:

```css
--text-display-xl: var(--text-hero-title);
--text-display-lg: var(--text-page-title);
--text-h1: var(--text-project-title);
--text-h2: var(--text-section-title);
--text-h3: var(--text-card-title);
--text-body-lg: var(--text-body-large);
--text-small: var(--text-caption);
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;
--space-16: 4rem;
--space-24: 6rem;
--space-32: 8rem;
--space-40: 10rem;
```

- [ ] **Step 3: Keep global behavior below tokens unchanged**

Do not remove these sections from `globals.css`: the `body` base rule, `.hero-scroll-range`, `.project-scroll-range`, `.project-scrub-flow`, `.project-scrub-flow::before`, `.project-scrub-flow::after`, both scroll-stage media queries, `::selection`, `html`, `@keyframes project-preloader`, `:where(a, button, input, textarea, select):focus-visible`, and the reduced-motion reset.

- [ ] **Step 4: Verify Tailwind sees the new utilities**

Run:

```bash
npm run build:web
```

Expected: PASS. If it fails with unknown utility or CSS variable cycle errors, adjust the token names so Tailwind receives concrete project utility names without changing component behavior.

## Task 3: Migrate Public And Project Page JSX Utilities

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/projetos/[slug]/not-found.tsx`
- Modify: `apps/web/src/app/components/ProjectScrollMedia.tsx`
- Modify: `apps/web/src/app/components/project-page/ProjectHero.tsx`
- Modify: `apps/web/src/app/components/project-page/ProjectMediaFallback.tsx`
- Modify: `apps/web/src/app/components/project-page/ProjectPage.tsx`
- Modify: `apps/web/src/app/components/project-page/ProjectPreloader.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/TextBlockSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ImageBlockSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/VideoBlockSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/TechnicalInfoSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ProjectContactCreditFooter.tsx`

- [ ] **Step 1: Replace repeated color, border, font, and text-size arbitrary utilities**

Apply these exact class substitutions in the listed public/project files:

```text
bg-[var(--paper)] -> bg-paper
bg-[var(--black)] -> bg-black
bg-[var(--charcoal)] -> bg-charcoal
text-[var(--ink)] -> text-ink
text-[var(--graphite)] -> text-graphite
text-[var(--mid-gray)] -> text-mid-gray
text-[var(--black)] -> text-black
border-[var(--line)] -> border-line
font-[var(--font-display)] -> font-display
text-[var(--text-hero-title)] -> text-hero-title
text-[var(--text-page-title)] -> text-page-title
text-[var(--text-project-title)] -> text-project-title
text-[var(--text-section-title)] -> text-section-title
text-[var(--text-card-title)] -> text-card-title
text-[var(--text-preloader-title)] -> text-preloader-title
text-[var(--text-body-large)] -> text-body-large
text-[var(--text-body)] -> text-body
text-[var(--text-caption)] -> text-caption
text-[var(--text-meta)] -> text-meta
text-[var(--text-label)] -> text-label
```

Keep expressive local arbitrary utilities unchanged, including:

```text
max-w-[1440px]
min-h-[calc(100svh-3rem)]
min-h-[calc(100svh-4rem)]
tracking-[0.28em]
tracking-[0.22em]
tracking-[-0.08em]
bg-[linear-gradient(90deg,rgb(0_0_0/0.58)_0%,rgb(0_0_0/0.22)_40%,transparent_72%)]
```

- [ ] **Step 2: Check no public/project arbitrary token references remain**

Run:

```bash
rg '\[var\(--|font-\[var\(--|border-\[var\(--|bg-\[var\(--|text-\[var\(--' apps/web/src/app/page.tsx apps/web/src/app/projetos apps/web/src/app/components
```

Expected: No matches in these public/project files. If matches remain for non-style runtime variables such as `var(--scrub-scroll-height)`, leave them only when they are required by CSS/runtime behavior and document the reason in the final summary.

- [ ] **Step 3: Run focused verification**

Run:

```bash
npm run lint:web
```

Expected: PASS.

## Task 4: Migrate Admin JSX Utilities

**Files:**
- Modify: `apps/web/src/app/admin/page.tsx`
- Modify: `apps/web/src/app/admin/login/page.tsx`
- Modify: `apps/web/src/app/admin/projetos/[id]/page.tsx`
- Modify: `apps/web/src/app/admin/projetos/novo/page.tsx`
- Modify: `apps/web/src/app/admin/components/AdminShell.tsx`
- Modify: `apps/web/src/app/admin/components/DeleteProjectForm.tsx`
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx`
- Modify: `apps/web/src/app/admin/components/ProjectForm.tsx`
- Modify: `apps/web/src/app/admin/components/ProjectSectionForm.tsx`
- Modify: `apps/web/src/app/admin/components/ProjectSectionsEditor.tsx`

- [ ] **Step 1: Replace admin typography arbitrary utilities**

Apply these exact class substitutions in admin files:

```text
font-[var(--font-display)] -> font-display
text-[var(--text-admin-title)] -> text-admin-title
text-[var(--text-admin-page-title)] -> text-admin-page-title
text-[var(--text-admin-section-title)] -> text-admin-section-title
text-[var(--text-admin-card-title)] -> text-admin-card-title
text-[var(--text-admin-body)] -> text-admin-body
text-[var(--text-admin-label)] -> text-admin-label
text-[var(--text-admin-help)] -> text-admin-help
text-[var(--text-admin-control)] -> text-admin-control
text-[var(--ink)] -> text-ink
text-[var(--graphite)] -> text-graphite
text-[var(--mid-gray)] -> text-mid-gray
border-[var(--line)] -> border-line
bg-[var(--paper)] -> bg-paper
```

Keep existing native Tailwind neutral classes such as `text-neutral-600`, `border-neutral-950`, `bg-white`, and `hover:bg-neutral-950` unless a file already uses project tokens for the same visual role.

- [ ] **Step 2: Check no admin arbitrary token references remain**

Run:

```bash
rg '\[var\(--|font-\[var\(--|border-\[var\(--|bg-\[var\(--|text-\[var\(--' apps/web/src/app/admin
```

Expected: No matches.

- [ ] **Step 3: Run focused verification**

Run:

```bash
npm run lint:web
```

Expected: PASS.

## Task 5: Final Cleanup And Verification

**Files:**
- Review: `apps/web/src/app/globals.css`
- Review: all files modified in Tasks 2-4

- [ ] **Step 1: Confirm remaining global CSS is global-only**

Run:

```bash
rg '^\.|^#|@keyframes|@media|:where|::selection|^html|^body|@theme|:root|@import' apps/web/src/app/globals.css
```

Expected: Output shows only import, root/theme tokens, document base rules, scroll/video global classes, keyframes, focus, and reduced-motion behavior.

- [ ] **Step 2: Confirm no unwanted arbitrary token utilities remain in app JSX**

Run:

```bash
rg '\[var\(--|font-\[var\(--|border-\[var\(--|bg-\[var\(--|text-\[var\(--' apps/web/src/app
```

Expected: No matches, except any explicitly justified runtime-only value that cannot become a Tailwind theme utility.

- [ ] **Step 3: Run final lint**

Run:

```bash
npm run lint:web
```

Expected: PASS.

- [ ] **Step 4: Run final build**

Run:

```bash
npm run build:web
```

Expected: PASS.

- [ ] **Step 5: Inspect final diff**

Run:

```bash
git diff -- apps/web/src/app/globals.css apps/web/src/app docs/superpowers/specs/2026-07-21-tailwind-primary-styling-design.md docs/superpowers/plans/2026-07-21-tailwind-primary-styling.md
```

Expected: Diff only contains Tailwind theme token additions, JSX class migrations, and the new spec/plan docs. Do not commit unless the user explicitly asks for a commit.

## Self-Review

- Spec coverage: Tasks 2-5 cover Tailwind token utilities, reduced global CSS scope, component migration, and validation. No separate Tailwind config file is introduced.
- No-placeholder scan: The plan contains no deferred-work markers and every command has an expected result.
- Type consistency: Utility names are consistent across theme declarations and JSX replacements: `bg-paper`, `text-ink`, `border-line`, `font-display`, `text-body`, public text tokens, and admin text tokens.
