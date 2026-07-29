# Shadcn Admin Initialization Design

## Context

The repository is an npm workspace monorepo with the Next.js application in `apps/web`. The web app uses Next.js `16.2.10`, React `19.2.4`, TypeScript, and Tailwind CSS 4 through `@import "tailwindcss"` in `apps/web/src/app/globals.css` plus `@tailwindcss/postcss` in `apps/web/postcss.config.mjs`.

There is no existing `components.json`, shadcn configuration, `cn()` helper, or shadcn dependency set in the project. TypeScript already maps `@/*` to `apps/web/src/*`, which matches the standard shadcn import style.

## Goal

Initialize shadcn/ui for the admin surface without changing the public portfolio visual presentation.

The setup is complete when:

- `apps/web` has a valid `components.json` recognized by the shadcn CLI.
- New shadcn components can be added through `npx shadcn@latest add ...` from `apps/web`.
- The project has a `cn()` helper at `apps/web/src/lib/utils.ts`.
- The default UI component destination is `apps/web/src/components/ui`.
- Tailwind CSS 4 and Next.js App Router remain compatible.
- Public portfolio pages are not visually redesigned by this setup step.

## Recommended Approach

Use the standard shadcn initialization for an existing Next.js app, executed from `apps/web` with npm through `npx shadcn@latest`.

This keeps the project aligned with upstream shadcn conventions:

- Config file: `apps/web/components.json`
- UI components: `apps/web/src/components/ui`
- Utility helper: `apps/web/src/lib/utils.ts`
- Component alias: `@/components`
- Utility alias: `@/lib/utils`
- Global CSS file: `apps/web/src/app/globals.css`

The CLI should be allowed to add the standard shadcn runtime dependencies, such as `clsx`, `tailwind-merge`, and icon/component dependencies required by selected components. No actual admin screen migration is part of this issue.

## Alternatives Considered

### Admin-Scoped Component Path

Putting UI components under `apps/web/src/app/admin/components/ui` would isolate the admin implementation. It is not recommended because it diverges from shadcn defaults and makes future CLI usage less predictable.

### Root Monorepo Setup

Putting `components.json` at the repository root would make sense if several apps or packages shared a UI library. It is unnecessary here because the only frontend workspace is `apps/web`, and the issue targets the admin inside that app.

## CSS And Theme Boundary

The existing `globals.css` already defines the portfolio monochrome system and Tailwind 4 theme tokens. shadcn initialization may add its own CSS variables required by generated components, but it must not remove or replace the existing portfolio tokens.

If shadcn adds base layer styles, they should coexist with the existing document styles for `body`, selection, focus visibility, reduced motion, and scroll/video behavior. This issue should avoid redesigning public pages, replacing the font stack, or changing the project-specific scroll media CSS.

## Component Boundary

This issue initializes the component system only. It should not convert existing admin components to shadcn components yet.

Future admin UI work can add individual components through the CLI and then compose them according to shadcn rules, using semantic tokens and the generated component variants instead of hand-rolled equivalents.

## Verification

After initialization:

- Run `npx shadcn@latest info --json` from `apps/web` and confirm it recognizes the config, aliases, Tailwind version, CSS file, and component paths.
- Run `npm run lint:web` from the repository root.
- Run `npm run build:web` from the repository root if dependency installation succeeds and the environment supports a production Next build.

## Out Of Scope

- Redesigning the admin UI.
- Migrating existing admin forms to shadcn components.
- Adding a starter component unless needed to prove CLI installation.
- Changing public portfolio layout, typography, colors, media behavior, or scroll interactions.
- Creating a shared root UI package.
