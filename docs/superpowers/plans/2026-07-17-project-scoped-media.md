# Project Scoped Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make project photos and videos belong to a specific project while preserving separate site/admin media.

**Architecture:** Add media ownership fields to `media_assets`, migrate existing references into `project` or `site` scope, then filter admin upload and selection flows by context. Public rendering keeps using the selected media records and should not visually change.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Drizzle ORM, Postgres, S3/MinIO signed uploads.

---

## File Structure

- Modify `src/lib/db/schema.ts`: add media scope type, `usageScope`, and nullable `projectId` on media assets.
- Create Drizzle migration in `drizzle/`: add columns and backfill existing media.
- Modify `src/lib/db/queries.ts`: add scoped media queries, validate project-scoped selections, and save media with scope.
- Modify `src/app/admin/actions.ts`: accept `usageScope` and `projectId` when saving media metadata.
- Modify `src/app/admin/components/MediaUploadField.tsx`: support site/project upload context and Portuguese labels.
- Modify `src/app/admin/page.tsx`: pass site media to profile and project media to each project editor.
- Modify `src/app/admin/components/ProjectForm.tsx`: receive project-scoped media for project selectors.
- Modify `src/app/admin/components/ProjectSectionsEditor.tsx`: receive project-scoped media for block selectors.
- Modify `src/app/admin/components/ProfileForm.tsx`: receive site-scoped media for profile selectors.
- Modify `scripts/seed.ts`: create seeded media with correct scope.

## Task 1: Schema And Migration

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `drizzle/0003_project_scoped_media.sql`

- [ ] Add `mediaUsageScopes = ["site", "project"] as const` and exported `MediaUsageScope` type.
- [ ] Add `usageScope` column to `mediaAssets` with varchar default `site` and not null.
- [ ] Add nullable `projectId` column to `mediaAssets` referencing `projects.id` with `onDelete: set null`.
- [ ] Add SQL migration to add the columns.
- [ ] In the migration, backfill project media by references from `projects.hero_video_asset_id`, `projects.fallback_image_asset_id`, `projects.client_architect_image_asset_id`, `project_sections.primary_media_asset_id`, and `project_sections.poster_media_asset_id`.
- [ ] In the migration, set media referenced by `site_profile.portrait_image_asset_id` back to `site` scope with `project_id = null`.
- [ ] Leave all remaining media as `site`.

## Task 2: Queries And Validation

**Files:**
- Modify: `src/lib/db/queries.ts`

- [ ] Update `MediaAssetCreate` to include `usageScope` and `projectId`.
- [ ] Add `getAdminSiteMediaAssets()` returning only `usageScope = site`.
- [ ] Add `getAdminProjectMediaAssets(projectId: string)` returning only media for that project.
- [ ] Keep `getAdminMediaAssets()` only if still needed, otherwise replace admin usage with scoped functions.
- [ ] Update `createMediaAsset()` to write `usageScope` and `projectId`.
- [ ] Add validation so project media references on project forms and section forms must belong to that same project.
- [ ] Keep site profile image validation limited to `usageScope = site` image media.

## Task 3: Upload Action And Component Context

**Files:**
- Modify: `src/app/admin/actions.ts`
- Modify: `src/app/admin/components/MediaUploadField.tsx`

- [ ] Update `saveMediaAssetAction` input to include `usageScope: "site" | "project"` and `projectId?: string`.
- [ ] Reject `usageScope = project` without `projectId`.
- [ ] Reject `usageScope = site` with a project id by normalizing project id to null.
- [ ] Add props to `MediaUploadField`: `usageScope`, `projectId`, `title`, `description`, and `mediaAssets`.
- [ ] Include the scope and project id when calling `saveMediaAssetAction`.
- [ ] Keep signed upload behavior unchanged.

## Task 4: Admin Data Flow

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/components/ProjectForm.tsx`
- Modify: `src/app/admin/components/ProjectSectionsEditor.tsx`
- Modify: `src/app/admin/components/ProfileForm.tsx`

- [ ] Load site media once for profile/site forms.
- [ ] Load project media for every project and store it by project id.
- [ ] For new project form, pass an empty project media list because uploads happen after the project exists.
- [ ] Render `Arquivos deste projeto` inside each existing project editor before its forms or between project details and blocks.
- [ ] Filter project form selectors with that project's media only.
- [ ] Filter block selectors with that project's media only.
- [ ] Filter profile image selector with site media only.

## Task 5: Seed Updates

**Files:**
- Modify: `scripts/seed.ts`

- [ ] Update seeded media insert/upsert values to include `usageScope` and `projectId`.
- [ ] Seed project media for SALA 02 after the project exists, or update it after project creation.
- [ ] Keep site profile media as `site` if added later.
- [ ] Run `npm run seed` locally after migration.

## Task 6: Verification

**Commands:**
- [ ] Run `npm run db:generate` if the manual migration needs metadata alignment.
- [ ] Run `npm run db:migrate`.
- [ ] Run `npm run seed`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `curl -I --max-time 10 http://localhost:3000/projetos/sala-02` and expect `200 OK`.
- [ ] Run `curl -I --max-time 10 http://localhost:3000/admin` and expect redirect to `/admin/login` when unauthenticated.

## Self Review

- Spec coverage: schema, migration, upload, selectors, site media, project media, seed, and public route verification are covered.
- Scope check: no transcoding, no multi-project sharing, no storage deletion, no i18n.
- Type consistency: `usageScope` uses `"site" | "project"`; `projectId` is nullable.
