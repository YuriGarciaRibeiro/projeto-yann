# Tailwind Primary Styling Design

## Context

The web app already uses Tailwind CSS 4 through `@import "tailwindcss"` in `apps/web/src/app/globals.css` and `@tailwindcss/postcss` in `apps/web/postcss.config.mjs`. The current pain point is not installation. It is that project styling still relies heavily on global CSS variables and global classes, which makes day-to-day customization harder than writing direct Tailwind utilities such as `flex flex-col items-center p-7 rounded-2xl`.

The portfolio must keep its existing premium architecture direction: monochrome palette, restrained editorial layout, generous negative space, quiet UI, and media-first presentation.

## Goal

Make Tailwind the primary styling interface for pages and components while keeping `globals.css` only for styling that is genuinely global or impractical to express repeatedly in JSX.

## Approach

Use Tailwind 4 theme tokens in CSS, then migrate JSX from arbitrary CSS variable utilities to readable Tailwind token utilities.

Examples:

- `bg-[var(--paper)]` becomes `bg-paper`
- `text-[var(--ink)]` becomes `text-ink`
- `border-[var(--line)]` becomes `border-line`
- `font-[var(--font-display)]` becomes `font-display`
- `text-[var(--text-body)]` becomes `text-body`

This keeps Tailwind ergonomic without losing the project design system.

## Global CSS Boundary

`apps/web/src/app/globals.css` should keep:

- `@import "tailwindcss"`
- Tailwind 4 `@theme` tokens for colors, fonts, text sizes, spacing, durations, and easing
- Base document styles for `html`, `body`, selection, focus visibility, and reduced motion
- Project-specific scroll/video classes whose behavior depends on pseudo-elements, media queries, `:has()`, or shared runtime hooks
- Keyframes used by existing components when keeping them in CSS is simpler than inlining arbitrary Tailwind animation values

`globals.css` should not be the normal place for component layout, spacing, colors, borders, or typography when a Tailwind utility can express the same thing clearly.

## Component Migration

Public pages, project page sections, and admin surfaces should be migrated incrementally but consistently:

- Prefer direct Tailwind utilities for layout, spacing, border, color, text size, and font family
- Replace repeated `var(...)` arbitrary utilities with named theme utilities
- Keep intentional arbitrary values where they are local and expressive, such as `max-w-[1440px]`, `tracking-[0.28em]`, or complex gradient values
- Preserve existing responsive behavior and visual hierarchy
- Do not introduce bright accent colors, large rounded SaaS cards, decorative gradients, glassmorphism, neon, or excessive shadows

## Validation

The migration is complete for this pass when:

- Tailwind tokens work through class names such as `bg-paper`, `text-ink`, `border-line`, `font-display`, and project text-size utilities
- `globals.css` is smaller and clearly limited to theme and true global behavior
- Existing pages still build under the current Next.js version
- Lint passes for the web workspace

## Out Of Scope

- Redesigning the visual identity
- Replacing scroll/video runtime behavior
- Removing every global rule regardless of fit
- Creating a Tailwind config file unless the current Tailwind 4 CSS-first setup proves insufficient
