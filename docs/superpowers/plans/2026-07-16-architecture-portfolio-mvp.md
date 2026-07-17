# Architecture Portfolio MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-ready architecture portfolio MVP with a cinematic public homepage, single-admin content management, Postgres persistence, and S3 media uploads.

**Architecture:** The Next.js app serves both the public site and the admin backend. Public pages read published content from Postgres; admin routes are protected by a simple single-user session; media uploads go directly from browser to S3 using signed URLs while metadata is stored in Postgres.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Postgres on Railway, S3-compatible object storage, server-side auth with httpOnly cookies, current animation stack already present in the project.

---

## Scope Split

This MVP combines public UI, backend, admin, auth, data modeling, and media delivery. Implement it in this order so every stage is independently testable:

1. Project hygiene and Next.js 16 documentation check.
2. Data layer and seed content.
3. Single-admin authentication.
4. Admin editing screens.
5. S3 signed upload flow.
6. Public cinematic homepage wired to database content.
7. Accessibility, media fallback, and production verification.

## File Map

Create or modify these files during implementation:

- Modify: `package.json` for database/auth dependencies and scripts.
- Modify: `.gitignore` to exclude `.superpowers/`, local env files, and generated artifacts if missing.
- Create: `.env.example` documenting Railway, auth, and S3 variables.
- Create: `src/lib/env.ts` for validated environment access.
- Create: `src/lib/db/schema.ts` for table definitions.
- Create: `src/lib/db/client.ts` for Postgres client access.
- Create: `src/lib/db/queries.ts` for public/admin content queries.
- Create: `src/lib/auth/password.ts` for hashing and verification helpers.
- Create: `src/lib/auth/session.ts` for cookie session helpers.
- Create: `src/lib/storage/s3.ts` for signed upload URL generation.
- Create: `src/app/admin/login/page.tsx` for admin login.
- Create: `src/app/admin/page.tsx` for admin dashboard/editor entry.
- Create: `src/app/admin/actions.ts` for server actions that mutate content.
- Create: `src/app/admin/components/*` for focused admin forms.
- Modify: `src/app/page.tsx` to render database-backed homepage content.
- Modify: `src/app/layout.tsx` for metadata, language, and app shell defaults.
- Modify: `src/app/globals.css` for design tokens and base typography.
- Create/modify: `src/app/components/*` for public editorial sections.
- Create: `src/app/api/uploads/sign/route.ts` for signed upload requests if server actions are not sufficient for client upload flow.
- Create: `scripts/seed.ts` or equivalent seed command for first admin and initial content.
- No unit tests are required for this MVP per user direction. Use lint, build, migration generation, seed execution, and manual verification instead.

## Task 1: Project Hygiene And Documentation Check

**Files:**
- Read: `AGENTS.md`
- Read: `node_modules/next/dist/docs/` or installed Next.js docs location if present
- Modify: `.gitignore`
- Modify: `package.json`
- Create: `.env.example`

- [ ] **Step 1: Verify Next.js docs location**

Run: `ls node_modules/next/dist`

Expected: output confirms installed Next.js package structure. If `node_modules/next/dist/docs/` is missing, inspect the package for included docs with `ls node_modules/next` and rely on installed type definitions plus official Next.js 16 behavior before coding.

- [ ] **Step 2: Add runtime dependency choices**

Use the smallest stable set that supports Railway Postgres, migrations, password hashing, and S3 signed URLs. Recommended default:

Run: `npm install drizzle-orm postgres zod bcryptjs @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

Run: `npm install -D drizzle-kit tsx vitest @types/bcryptjs`

Expected: `package.json` and `package-lock.json` update successfully.

- [ ] **Step 3: Add scripts**

Modify `package.json` scripts to include:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio",
  "seed": "tsx scripts/seed.ts",
  "test": "vitest run --passWithNoTests"
}
```

Keep existing `dev`, `build`, `start`, and `lint` scripts.

- [ ] **Step 4: Update ignore rules**

Ensure `.gitignore` includes:

```gitignore
.env*
!.env.example
.superpowers/
```

- [ ] **Step 5: Create `.env.example`**

Create:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
AUTH_SECRET="replace-with-long-random-secret"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="replace-before-production"
S3_ENDPOINT="https://s3.amazonaws.com"
S3_REGION="us-east-1"
S3_BUCKET="architecture-portfolio"
S3_ACCESS_KEY_ID="replace-me"
S3_SECRET_ACCESS_KEY="replace-me"
S3_PUBLIC_BASE_URL="https://cdn.example.com"
```

- [ ] **Step 6: Verify**

Run: `npm run lint`

Expected: lint completes without new errors from this task.

- [ ] **Step 7: Commit when permitted**

Run only if the user has explicitly allowed commits: `git add package.json package-lock.json .gitignore .env.example && git commit -m "chore: prepare portfolio app foundation"`

## Task 2: Database Schema And Seed Content

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/client.ts`
- Create: `src/lib/db/queries.ts`
- Create: `scripts/seed.ts`

- [ ] **Step 1: Create environment helper**

Implement `src/lib/env.ts` with `zod` validation for required server environment variables. Export `env` and never read `process.env` directly from feature code.

- [ ] **Step 2: Create Drizzle config**

Configure `drizzle.config.ts` to read `DATABASE_URL` and emit migrations under `drizzle/`.

- [ ] **Step 3: Define schema**

Create tables for `admin_users`, `site_profile`, `projects`, and `media_assets`.

Required project fields:

```ts
id, slug, title, subtitle, category, location, year, shortDescription,
isPublished, isFeatured, heroVideoAssetId, fallbackImageAssetId,
createdAt, updatedAt
```

Required media fields:

```ts
id, storageKey, url, mimeType, sizeBytes, altText, width, height,
durationSeconds, createdAt
```

- [ ] **Step 4: Enforce one featured project in query layer**

Create a `setFeaturedProject(projectId: string)` query that runs in a transaction: first clears all `isFeatured`, then sets the target project to featured and published.

- [ ] **Step 5: Implement seed script**

Seed one admin user from `ADMIN_EMAIL` and `ADMIN_PASSWORD`, one default profile, and one project named `SALA 02`. Use the existing `/sala-02-scroll.mp4` and `/sala-02.mp4` public files as local fallback seed URLs until S3 media exists.

- [ ] **Step 6: Verify**

Run: `npm run db:generate`

Expected: migrations are generated.

Run: `npm run lint`

Expected: lint passes.

- [ ] **Step 7: Commit when permitted**

Run only if allowed: `git add drizzle.config.ts drizzle src lib scripts package.json package-lock.json && git commit -m "feat: add portfolio data model"`

## Task 3: Single Admin Authentication

**Files:**
- Create: `src/lib/auth/password.ts`
- Create: `src/lib/auth/session.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/login/actions.ts`
- Create: `src/middleware.ts` if route-level middleware is the simplest protection approach.

- [ ] **Step 1: Implement password helpers**

Use `bcryptjs` to export `hashPassword(password: string)` and `verifyPassword(password: string, hash: string)`.

- [ ] **Step 2: Implement session helpers**

Use `AUTH_SECRET` to sign a compact session payload containing admin user id and expiry. Store it in an httpOnly, sameSite `lax`, secure-in-production cookie.

- [ ] **Step 3: Build login action**

Create a server action that accepts email/password, verifies against `admin_users`, sets the session cookie, and redirects to `/admin`.

- [ ] **Step 4: Build login UI**

Create a minimal monochrome form at `/admin/login`. It should show errors without revealing whether the email or password was wrong.

- [ ] **Step 5: Protect admin routes**

Redirect unauthenticated users from `/admin` to `/admin/login`. Authenticated users visiting `/admin/login` should be redirected to `/admin`.

- [ ] **Step 6: Verify**

Run: `npm run lint`

Expected: lint passes.

- [ ] **Step 7: Commit when permitted**

Run only if allowed: `git add src && git commit -m "feat: add single admin authentication"`

## Task 4: Admin Content Editing

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/actions.ts`
- Create: `src/app/admin/components/AdminShell.tsx`
- Create: `src/app/admin/components/ProfileForm.tsx`
- Create: `src/app/admin/components/HomepageCopyForm.tsx`
- Create: `src/app/admin/components/ProjectForm.tsx`
- Create: `src/app/admin/components/FeaturedProjectPicker.tsx`
- Modify: `src/lib/db/queries.ts`

- [ ] **Step 1: Add admin query functions**

Add functions to read and update `SiteProfile`, create/update projects, list projects, and call `setFeaturedProject`.

- [ ] **Step 2: Build server actions**

Create server actions for profile save, homepage copy save, project save, and featured project selection. Each action must check the admin session before mutation.

- [ ] **Step 3: Build admin shell**

Create a simple page layout with sections for profile, homepage text, project, featured project, and media. Keep it utilitarian and monochrome.

- [ ] **Step 4: Build forms**

Each form should use native inputs, labels, and submit buttons. Do not add a visual framework. Include field-level labels for accessibility.

- [ ] **Step 5: Add success/error feedback**

After each save, show a concise status message. Failed validation should keep the admin on the same page with the entered data preserved when practical.

- [ ] **Step 6: Verify manually**

Run: `npm run dev`

Expected manual result: login works, `/admin` loads, profile can be saved, project can be edited, featured project can be changed.

- [ ] **Step 7: Commit when permitted**

Run only if allowed: `git add src/app/admin src/lib/db && git commit -m "feat: add admin content editing"`

## Task 5: S3 Signed Upload Flow

**Files:**
- Create: `src/lib/storage/s3.ts`
- Create: `src/app/api/uploads/sign/route.ts`
- Create: `src/app/admin/components/MediaUploadField.tsx`
- Modify: `src/app/admin/actions.ts`
- Modify: `src/lib/db/queries.ts`

- [ ] **Step 1: Implement S3 client helper**

Create a helper that uses `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` to generate a signed PUT URL.

- [ ] **Step 2: Add signed upload route**

Create `POST /api/uploads/sign`. It must require an admin session and accept file name, MIME type, and size. Reject non-image and non-video MIME types. Return `uploadUrl`, `storageKey`, and final public `url`.

- [ ] **Step 3: Add media metadata save action**

After browser upload succeeds, save `MediaAsset` metadata to Postgres.

- [ ] **Step 4: Build admin upload component**

The component should request a signed URL, upload the file directly to S3 with `fetch(uploadUrl, { method: "PUT", body: file })`, then call the save action.

- [ ] **Step 5: Connect project media fields**

Allow selecting uploaded media as hero video and fallback image for the featured project.

- [ ] **Step 6: Verify with real S3-compatible credentials**

Run: `npm run dev`

Expected manual result: upload succeeds, object exists in S3, media row exists in Postgres, and project can reference it.

- [ ] **Step 7: Commit when permitted**

Run only if allowed: `git add src/lib/storage src/app/api src/app/admin src/lib/db && git commit -m "feat: add signed media uploads"`

## Task 6: Public Cinematic Homepage

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create/modify: `src/app/components/HeroFeaturedProject.tsx`
- Create/modify: `src/app/components/FeaturedProjectMedia.tsx`
- Create: `src/app/components/ManifestoSection.tsx`
- Create: `src/app/components/ProfileSection.tsx`
- Create: `src/app/components/ServicesSection.tsx`
- Create: `src/app/components/ContactSection.tsx`
- Create: `src/app/components/SiteFooter.tsx`
- Modify or replace: `src/app/components/ScrollVideoParallax.tsx`

- [ ] **Step 1: Read relevant local project skills**

Use the project skills before coding this task: `architecture-portfolio-design`, `monochrome-visual-system`, `editorial-layout-typography`, `minimal-ui-components`, `scroll-video-experience`, `media-performance`, and `responsive-accessibility`.

- [ ] **Step 2: Replace test copy with real structure**

Remove “Teste visual” language from the public page. Query featured project and profile content from the database.

- [ ] **Step 3: Build hero media component**

`FeaturedProjectMedia` should render video when available and allowed, render fallback image for reduced motion or video errors, and avoid mandatory scroll scrubbing on touch/reduced-motion contexts.

- [ ] **Step 4: Build editorial sections**

Create manifesto, profile, services, contact, and footer sections using a restrained monochrome design with generous spacing.

- [ ] **Step 5: Preserve existing SALA 02 demo value**

Use existing public media as seed/demo content until S3 media is configured. Do not depend on the root-level `SALA 02.mp4` file for runtime.

- [ ] **Step 6: Verify public page**

Run: `npm run dev`

Expected manual result: homepage loads from database content, hero displays media/fallback, sections render on desktop and mobile.

- [ ] **Step 7: Commit when permitted**

Run only if allowed: `git add src/app && git commit -m "feat: build cinematic portfolio homepage"`

## Task 7: Accessibility, Performance, And Production Verification

**Files:**
- Modify: public/admin components as needed.
- Modify: `README.md` to document setup, env, seed, and deploy steps.

- [ ] **Step 1: Run design review skill**

Use `architecture-design-review` to audit the public page and admin against the project design system.

- [ ] **Step 2: Check reduced motion**

Manually verify with `prefers-reduced-motion` enabled that the homepage does not require scroll-scrubbed video to understand the content.

- [ ] **Step 3: Check keyboard navigation**

Tab through login, admin forms, navigation, and contact links. Focus states must be visible.

- [ ] **Step 4: Check mobile layout**

Verify the homepage and admin on narrow viewport widths. Content must not overflow horizontally.

- [ ] **Step 5: Run automated checks**

Run: `npm run lint`

Expected: passes.

Run: `npm run build`

Expected: production build succeeds.

- [ ] **Step 6: Update README**

Document local setup:

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run seed
npm run dev
```

Document Railway setup: set env vars, attach Postgres, run migrations/seed, configure S3 variables.

- [ ] **Step 7: Commit when permitted**

Run only if allowed: `git add README.md src && git commit -m "docs: document portfolio deployment"`

## Completion Criteria

The MVP is complete when:

1. Public homepage uses Postgres-backed content.
2. Admin login works for one user.
3. Admin can edit profile, homepage copy, project content, and featured project.
4. S3 signed upload flow works with real credentials.
5. Featured media has fallback behavior.
6. `npm run lint` and `npm run build` pass.
7. README documents local and Railway setup.

## Plan Self-Review

Spec coverage:

1. Public cinematic homepage: Task 6.
2. Admin single-user area: Tasks 3 and 4.
3. Postgres data model: Task 2.
4. S3 media upload: Task 5.
5. Railway/deploy setup: Tasks 1 and 7.
6. Accessibility/media fallback: Tasks 6 and 7.
7. No public project detail pages in MVP: reinforced in Tasks 2 and 6.

Placeholder scan: no unresolved placeholders remain; environment values are examples in `.env.example`, not implementation gaps.

Type consistency: entity names and responsibilities match the approved spec: `AdminUser`, `SiteProfile`, `Project`, and `MediaAsset`.

User adjustment: unit tests are not required for this MVP. The plan relies on lint, build, migration generation, seed execution, and manual verification gates.
