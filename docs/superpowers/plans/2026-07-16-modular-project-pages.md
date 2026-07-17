# Modular Project Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the app from a public homepage portfolio into a single-admin system that creates modular public project pages at `/projetos/[slug]`.

**Architecture:** Keep the existing Next.js app, admin auth, Postgres/Drizzle data layer, and S3/MinIO media upload flow. Add project client fields and ordered project sections, render public pages by slug, and make `/` redirect to the primary published project or show a minimal Yann-branded empty state.

**Tech Stack:** Next.js 16, React 19, TypeScript, Drizzle/Postgres, S3-compatible storage, Tailwind CSS 4, existing Framer Motion/Lenis video interaction foundation.

---

## User Direction

Do not add unit tests for this MVP. Verification gates are `npm run lint`, `npm run build`, `npm run db:generate`, `npm run db:migrate`, `npm run seed`, and manual browser checks.

## Task 1: Data Model For Modular Project Pages

**Files:**
- Modify: `src/lib/db/schema.ts`
- Modify: `src/lib/db/queries.ts`
- Modify: `scripts/seed.ts`
- Generate: `drizzle/*`

- [ ] Add client architect fields to `projects`: `clientArchitectName`, `clientArchitectEmail`, `clientArchitectPhone`, `clientArchitectWebsite`, `clientArchitectInstagram`, `clientArchitectImageAssetId`.
- [ ] Keep existing `heroVideoAssetId`, `fallbackImageAssetId`, `isPublished`, and `isFeatured`. Treat `isFeatured` as the primary redirect target for `/`.
- [ ] Add `project_sections` table with `id`, `projectId`, `sortOrder`, `type`, `title`, `body`, `primaryMediaAssetId`, `posterMediaAssetId`, `caption`, `metadata`, `isEnabled`, `createdAt`, `updatedAt`.
- [ ] Define section type values in TypeScript: `parallax_video`, `video_block`, `image_block`, `text_block`, `technical_info`, `contact_credit`.
- [ ] Add query functions: list admin sections by project, upsert section, delete section, move/reorder sections, get published project by slug with media and enabled sections.
- [ ] Validate section media by type: video sections require video primary media when set; image sections require image primary media; poster media must be image.
- [ ] Update seed so `SALA 02` has client architect fields and at least two starter sections: one `parallax_video` and one `contact_credit`.
- [ ] Run `npm run db:generate`.

## Task 2: Admin Project Form Update

**Files:**
- Modify: `src/app/admin/components/ProjectForm.tsx`
- Modify: `src/app/admin/actions.ts`
- Modify: `src/lib/db/queries.ts`

- [ ] Add client architect fields to the project form.
- [ ] Add optional client architect image selector filtered to `image/*` assets.
- [ ] Parse and save these fields in `saveProjectAction`.
- [ ] Keep project publish and primary/featured behavior.

## Task 3: Admin Section Editor

**Files:**
- Create: `src/app/admin/components/ProjectSectionsEditor.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/actions.ts`
- Modify: `src/lib/db/queries.ts`

- [ ] Render each project's sections under its project form.
- [ ] Add a form to create a section for a project.
- [ ] Add edit controls for section type, order, title, body, media, poster, caption, metadata JSON, and enabled state.
- [ ] Add delete action for a section.
- [ ] Keep controls simple; no drag-and-drop in MVP. Reordering is by numeric `sortOrder`.
- [ ] Validate JSON metadata before saving.

## Task 4: Public Project Route

**Files:**
- Create: `src/app/projetos/[slug]/page.tsx`
- Create: `src/app/projetos/[slug]/not-found.tsx` if useful
- Create: `src/app/components/project-page/ProjectPage.tsx`
- Create: `src/app/components/project-page/ProjectHero.tsx`
- Create: `src/app/components/project-page/ProjectSectionRenderer.tsx`
- Create: `src/app/components/project-page/section-renderers/*`
- Reuse/modify: `src/app/components/ScrollVideoParallax.tsx`
- Reuse/modify: `src/app/components/FeaturedProjectMedia.tsx`

- [ ] Load published project by slug with media and enabled sections.
- [ ] Return 404 for missing/unpublished project.
- [ ] Render Yann mark/name at the top as discreet editorial signature.
- [ ] Render fixed hero with title, subtitle, client architect, location, year, category, and hero media.
- [ ] Render sections in `sortOrder`.
- [ ] Implement section renderers for `parallax_video`, `video_block`, `image_block`, `text_block`, `technical_info`, `contact_credit`.
- [ ] Preserve reduced motion/mobile fallbacks for parallax sections.
- [ ] Render `Produzido por Yann` discreetly in contact/credit.

## Task 5: Root Route Behavior

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/lib/db/queries.ts`

- [ ] Replace full homepage behavior.
- [ ] If a published featured project exists, redirect `/` to `/projetos/[slug]`.
- [ ] If no published project exists, render a minimal Yann-branded empty state with no project catalog.

## Task 6: Cleanup Old Homepage-Centric UI

**Files:**
- Review/modify: `src/app/components/ManifestoSection.tsx`
- Review/modify: `src/app/components/ProfileSection.tsx`
- Review/modify: `src/app/components/ServicesSection.tsx`
- Review/modify: `src/app/components/ContactSection.tsx`
- Review/modify: `src/app/components/SiteFooter.tsx`

- [ ] Keep reusable components only if used by the new project route.
- [ ] Remove homepage-only assumptions from public rendering.
- [ ] Do not delete admin/profile data unless unused and migration-safe.

## Task 7: Documentation And Verification

**Files:**
- Modify: `README.md`

- [ ] Document new public URL model: `/projetos/[slug]`.
- [ ] Document admin workflow: upload media, create project, add sections, publish, open public URL.
- [ ] Document that `/` redirects to primary published project or shows empty state.
- [ ] Run `npm run db:generate` if schema changed after earlier tasks.
- [ ] Run `npm run db:migrate`.
- [ ] Run `npm run seed`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Manually check local app at `http://localhost:3000/projetos/sala-02`.

## Completion Criteria

The migration is complete when:

1. Admin can create/edit project client identity fields.
2. Admin can add/edit/delete ordered sections.
3. A published project renders at `/projetos/[slug]`.
4. `/` redirects to the primary published project or shows a minimal Yann empty state.
5. All six initial section types render.
6. Existing media upload flow still works.
7. `npm run lint` and `npm run build` pass.

## Plan Self-Review

Spec coverage: public routing, fixed template, modular sections, admin workflow, root route behavior, design constraints, and MVP exclusions are covered.

Placeholder scan: no placeholders, TBDs, or unspecified implementation areas remain.

Type consistency: project section type names match the approved spec and are reused consistently throughout the plan.
