# Global Typography Variables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize public and admin screen font sizes in editable CSS variables so typography can be tuned from one file.

**Architecture:** Extend the existing CSS custom property scale in `apps/web/src/app/globals.css`, then replace hardcoded Tailwind font-size utilities in public and admin UI with `text-[var(--...)]`. Keep layout, spacing, tracking, colors, font families, and behavior unchanged.

**Tech Stack:** Next.js App Router, React, Tailwind CSS v4 arbitrary values, CSS custom properties, npm workspace scripts.

---

## File Structure

- Modify: `apps/web/src/app/globals.css`
  - Owns all typography variables. Existing variables remain available where possible, but new semantic aliases become the preferred knobs for tuning.
- Modify: `apps/web/src/app/page.tsx`
  - Uses public typography variables for the empty home state.
- Modify: `apps/web/src/app/projetos/[slug]/not-found.tsx`
  - Uses public typography variables for the project not-found page.
- Modify: `apps/web/src/app/components/project-page/ProjectHero.tsx`
  - Uses project typography variables for hero title, metadata, subtitle, facts, and scroll prompt.
- Modify: `apps/web/src/app/components/project-page/ProjectPreloader.tsx`
  - Uses project typography variables for loading label and project title.
- Modify: `apps/web/src/app/components/project-page/ProjectMediaFallback.tsx`
  - Uses project typography variables for fallback label and body text.
- Modify: `apps/web/src/app/components/project-page/section-renderers/*.tsx`
  - Uses project typography variables for section titles, body text, captions, metadata, and labels.
- Modify: `apps/web/src/app/admin/login/page.tsx`
  - Uses admin typography variables for login title, labels, input controls, alert, and button.
- Modify: `apps/web/src/app/admin/page.tsx`
  - Uses admin typography variables for page headings, list headings, descriptions, metadata, buttons, and empty states.
- Modify: `apps/web/src/app/admin/projetos/novo/page.tsx`
  - Uses admin typography variables for page heading, description, metadata, and navigation button.
- Modify: `apps/web/src/app/admin/projetos/[id]/page.tsx`
  - Uses admin typography variables for page heading, description, metadata, and navigation buttons.
- Modify: `apps/web/src/app/admin/components/AdminShell.tsx`
  - Uses admin typography variables for sidebar title, labels, nav items, status, and error messages.
- Modify: `apps/web/src/app/admin/components/ProjectForm.tsx`
  - Uses admin typography variables for form titles, descriptions, labels, controls, help text, errors, checkbox, fieldset legend, and buttons.
- Modify: `apps/web/src/app/admin/components/ProjectSectionForm.tsx`
  - Uses admin typography variables for section titles, summaries, labels, controls, help text, checkbox, details summary, and buttons.
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx`
  - Uses admin typography variables for upload dialog, section headings, labels, input, button, messages, and media library rows.
- Modify: `apps/web/src/app/admin/components/DeleteProjectForm.tsx`
  - Uses admin typography variables for danger heading, description, and button.
- Modify: `apps/web/src/app/admin/components/ProjectSectionsEditor.tsx`
  - Uses admin typography variables for section heading, description, and empty state.

## Task 1: Add Typography Variables

**Files:**
- Modify: `apps/web/src/app/globals.css:16-26`

- [ ] **Step 1: Run the current hardcoded typography audit**

Run:

```bash
rg 'text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)|text-\[[^\]]*(0\.6875rem|clamp|rem|px)' apps/web/src/app -g '*.tsx'
```

Expected: FAIL for the intended final state by printing current hardcoded text-size utilities in `page.tsx`, project page components, and admin components.

- [ ] **Step 2: Replace the typography variable block**

In `apps/web/src/app/globals.css`, replace lines 18-26 with this block:

```css
  --text-hero-title: clamp(4rem, 10vw, 9rem);
  --text-page-title: clamp(3.5rem, 12vw, 10rem);
  --text-project-title: clamp(2.75rem, 5.5vw, 5.5rem);
  --text-section-title: clamp(2.25rem, 4vw, 4rem);
  --text-card-title: clamp(1.75rem, 2.8vw, 2.75rem);
  --text-preloader-title: clamp(2.5rem, 12vw, 5.5rem);
  --text-body-large: clamp(1.125rem, 1.4vw, 1.375rem);
  --text-body: clamp(1rem, 1.1vw, 1.125rem);
  --text-caption: 0.875rem;
  --text-meta: 0.875rem;
  --text-label: 0.6875rem;
  --text-admin-title: clamp(2.25rem, 6vw, 3.75rem);
  --text-admin-page-title: 2.25rem;
  --text-admin-section-title: 1.25rem;
  --text-admin-card-title: 1.875rem;
  --text-admin-body: 0.875rem;
  --text-admin-label: 0.875rem;
  --text-admin-help: 0.75rem;
  --text-admin-control: 1rem;

  --text-display-xl: var(--text-hero-title);
  --text-display-lg: var(--text-page-title);
  --text-h1: var(--text-project-title);
  --text-h2: var(--text-section-title);
  --text-h3: var(--text-card-title);
  --text-body-lg: var(--text-body-large);
  --text-small: var(--text-caption);
```

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint:web
```

Expected: PASS. CSS-only variable additions should not create lint errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat: add global typography variables"
```

## Task 2: Convert Public Project Typography

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/projetos/[slug]/not-found.tsx`
- Modify: `apps/web/src/app/components/project-page/ProjectHero.tsx`
- Modify: `apps/web/src/app/components/project-page/ProjectPreloader.tsx`
- Modify: `apps/web/src/app/components/project-page/ProjectMediaFallback.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ContactCreditSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/TechnicalInfoSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/TextBlockSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ProjectContactCreditFooter.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ImageBlockSection.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/ParallaxVideoSequence.tsx`
- Modify: `apps/web/src/app/components/project-page/section-renderers/VideoBlockSection.tsx`

- [ ] **Step 1: Run the public typography audit**

Run:

```bash
rg 'text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)|text-\[[^\]]*(0\.6875rem|clamp|rem|px)' apps/web/src/app/page.tsx apps/web/src/app/projetos apps/web/src/app/components/project-page -g '*.tsx'
```

Expected: FAIL for the intended final state by printing public hardcoded text-size utilities.

- [ ] **Step 2: Replace home page sizes**

In `apps/web/src/app/page.tsx`, make these replacements:

```tsx
text-[0.6875rem]
```

becomes:

```tsx
text-[var(--text-label)]
```

```tsx
font-serif text-[clamp(3.5rem,12vw,10rem)]
```

becomes:

```tsx
font-[var(--font-display)] text-[var(--text-page-title)]
```

```tsx
text-base leading-relaxed text-[var(--graphite)] sm:text-lg
```

becomes:

```tsx
text-[var(--text-body)] leading-relaxed text-[var(--graphite)]
```

- [ ] **Step 3: Replace project page aliases**

Use semantic variables in project files:

```tsx
text-[var(--text-display-xl)] -> text-[var(--text-hero-title)]
text-[var(--text-h1)] -> text-[var(--text-project-title)]
text-[var(--text-h2)] -> text-[var(--text-section-title)]
text-[var(--text-h3)] -> text-[var(--text-card-title)]
text-[var(--text-body-lg)] -> text-[var(--text-body-large)]
text-[clamp(2.5rem,12vw,5.5rem)] -> text-[var(--text-preloader-title)]
```

- [ ] **Step 4: Replace public `text-sm` body/meta usages**

In project page components only, replace human-visible metadata, captions, fallback messages, technical rows, hero facts, and parallax side captions:

```tsx
text-sm leading-6
```

with:

```tsx
text-[var(--text-caption)] leading-6
```

Replace plain metadata containers:

```tsx
text-sm text-[var(--graphite)]
text-sm text-white/60
text-sm text-white/62
```

with the matching variable form:

```tsx
text-[var(--text-meta)] text-[var(--graphite)]
text-[var(--text-meta)] text-white/60
text-[var(--text-meta)] text-white/62
```

- [ ] **Step 5: Run the public typography audit again**

Run:

```bash
rg 'text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)|text-\[[^\]]*(0\.6875rem|clamp|rem|px)' apps/web/src/app/page.tsx apps/web/src/app/projetos apps/web/src/app/components/project-page -g '*.tsx'
```

Expected: No output, except `sr-only` if the regex is expanded manually. Existing `text-[var(--...)]` values are allowed.

- [ ] **Step 6: Run lint**

Run:

```bash
npm run lint:web
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/page.tsx apps/web/src/app/projetos/[slug]/not-found.tsx apps/web/src/app/components/project-page
git commit -m "feat: use typography variables on public pages"
```

## Task 3: Convert Admin Page Typography

**Files:**
- Modify: `apps/web/src/app/admin/login/page.tsx`
- Modify: `apps/web/src/app/admin/page.tsx`
- Modify: `apps/web/src/app/admin/projetos/novo/page.tsx`
- Modify: `apps/web/src/app/admin/projetos/[id]/page.tsx`
- Modify: `apps/web/src/app/admin/components/AdminShell.tsx`

- [ ] **Step 1: Run the admin page typography audit**

Run:

```bash
rg 'text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)|text-\[[^\]]*(0\.6875rem|clamp|rem|px)' apps/web/src/app/admin/login/page.tsx apps/web/src/app/admin/page.tsx apps/web/src/app/admin/projetos apps/web/src/app/admin/components/AdminShell.tsx -g '*.tsx'
```

Expected: FAIL for the intended final state by printing admin page hardcoded text-size utilities.

- [ ] **Step 2: Apply admin page replacements**

Use these replacements in the files listed for this task:

```tsx
text-xs uppercase -> text-[var(--text-admin-help)] uppercase
text-sm uppercase -> text-[var(--text-admin-label)] uppercase
text-sm leading-6 -> text-[var(--text-admin-body)] leading-6
text-sm text-neutral-600 -> text-[var(--text-admin-body)] text-neutral-600
text-sm text-white -> text-[var(--text-admin-body)] text-white
text-base -> text-[var(--text-admin-control)]
text-xl font-normal -> text-[var(--text-admin-section-title)] font-normal
text-2xl font-normal -> text-[var(--text-admin-section-title)] font-normal
text-3xl font-normal -> text-[var(--text-admin-card-title)] font-normal
text-4xl font-normal -> text-[var(--text-admin-page-title)] font-normal
text-4xl font-normal tracking-[-0.04em] md:text-6xl -> text-[var(--text-admin-title)] font-normal tracking-[-0.04em]
font-[var(--font-display)] text-3xl font-normal tracking-[-0.04em] lg:text-4xl -> font-[var(--font-display)] text-[var(--text-admin-page-title)] font-normal tracking-[-0.04em]
```

- [ ] **Step 3: Run the admin page typography audit again**

Run:

```bash
rg 'text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)|text-\[[^\]]*(0\.6875rem|clamp|rem|px)' apps/web/src/app/admin/login/page.tsx apps/web/src/app/admin/page.tsx apps/web/src/app/admin/projetos apps/web/src/app/admin/components/AdminShell.tsx -g '*.tsx'
```

Expected: No output, except possible `sr-only` if the regex is broadened manually.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint:web
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/admin/login/page.tsx apps/web/src/app/admin/page.tsx apps/web/src/app/admin/projetos apps/web/src/app/admin/components/AdminShell.tsx
git commit -m "feat: use typography variables on admin pages"
```

## Task 4: Convert Admin Form Component Typography

**Files:**
- Modify: `apps/web/src/app/admin/components/ProjectForm.tsx`
- Modify: `apps/web/src/app/admin/components/ProjectSectionForm.tsx`
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx`
- Modify: `apps/web/src/app/admin/components/DeleteProjectForm.tsx`
- Modify: `apps/web/src/app/admin/components/ProjectSectionsEditor.tsx`

- [ ] **Step 1: Run the admin component typography audit**

Run:

```bash
rg 'text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)|text-\[[^\]]*(0\.6875rem|clamp|rem|px)' apps/web/src/app/admin/components -g '*.tsx'
```

Expected: FAIL for the intended final state by printing admin component hardcoded text-size utilities.

- [ ] **Step 2: Apply admin form replacements**

Use these replacements in the files listed for this task:

```tsx
text-xs leading-5 -> text-[var(--text-admin-help)] leading-5
text-xs uppercase -> text-[var(--text-admin-help)] uppercase
text-sm uppercase -> text-[var(--text-admin-label)] uppercase
text-sm leading-5 -> text-[var(--text-admin-body)] leading-5
text-sm leading-6 -> text-[var(--text-admin-body)] leading-6
text-sm text-neutral-600 -> text-[var(--text-admin-body)] text-neutral-600
text-sm text-neutral-700 -> text-[var(--text-admin-body)] text-neutral-700
text-sm text-white -> text-[var(--text-admin-body)] text-white
text-sm outline-none -> text-[var(--text-admin-body)] outline-none
file:text-sm -> file:text-[var(--text-admin-body)]
text-base -> text-[var(--text-admin-control)]
text-lg font-normal -> text-[var(--text-admin-section-title)] font-normal
text-xl font-normal -> text-[var(--text-admin-section-title)] font-normal
text-2xl font-normal -> text-[var(--text-admin-section-title)] font-normal
```

- [ ] **Step 3: Preserve button semantics**

For all buttons and link-buttons in these admin components, use:

```tsx
text-[var(--text-admin-label)] uppercase tracking-[0.16em]
```

Do not change borders, padding, `min-h-*`, colors, hover states, focus states, disabled states, or form actions.

- [ ] **Step 4: Run the admin component typography audit again**

Run:

```bash
rg 'text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)|text-\[[^\]]*(0\.6875rem|clamp|rem|px)' apps/web/src/app/admin/components -g '*.tsx'
```

Expected: No output.

- [ ] **Step 5: Run lint**

Run:

```bash
npm run lint:web
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/admin/components
git commit -m "feat: use typography variables in admin forms"
```

## Task 5: Final Verification

**Files:**
- Review: `apps/web/src/app/globals.css`
- Review: `apps/web/src/app/**/*.tsx`

- [ ] **Step 1: Run the full typography audit**

Run:

```bash
rg 'text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)|text-\[[^\]]*(0\.6875rem|clamp|rem|px)' apps/web/src/app -g '*.tsx'
```

Expected: No output except acceptable non-size utilities if the regex is adjusted manually. All screen font sizes should use `text-[var(--...)]`.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint:web
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build:web
```

Expected: PASS.

- [ ] **Step 4: Manual visual check**

Run:

```bash
npm run dev:web
```

Open:

```text
http://localhost:3000/
http://localhost:3000/admin/login
http://localhost:3000/admin
http://localhost:3000/projetos/<published-project-slug>
```

Expected: Pages keep the current hierarchy. Editing font sizes in `apps/web/src/app/globals.css` visibly changes the matching areas without editing TSX files.

- [ ] **Step 5: Commit any final fixes**

```bash
git status --short
git add apps/web/src/app
git commit -m "fix: finalize typography variable usage"
```

Only run this commit if Step 4 required additional fixes after the earlier task commits.

## Self-Review

- Spec coverage: The plan covers global variables, public project pages, home, admin pages, admin components, responsive `clamp(...)` variables, lint, build, and manual visual verification.
- Placeholder scan: No placeholder markers or unspecified implementation steps remain.
- Type consistency: The variable names match the approved design and are consistently referenced as CSS custom properties through Tailwind arbitrary values.
