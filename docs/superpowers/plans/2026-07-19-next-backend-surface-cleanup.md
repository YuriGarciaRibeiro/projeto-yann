# Next Backend Surface Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove obsolete database, storage, auth, and route-handler backend surface from the Next app after the FastAPI migration.

**Architecture:** First move shared frontend types and upload validation into DB/storage-free modules. Then update imports so admin UI/server actions call only FastAPI API clients or frontend-safe helpers. Finally delete dead DB/storage/auth files and verify no backend-only imports remain in `apps/web`.

**Tech Stack:** Next.js 16, TypeScript, FastAPI, Pytest, Docker Compose, ripgrep.

---

## Scope

In scope:

- Remove remaining imports of `@/lib/db/*`, `@/lib/storage/*`, and `@/lib/auth/*` from `apps/web/src`.
- Create frontend-safe type/constants module for media scopes, video variants, and project section types.
- Create frontend-safe upload validation module for UI preflight checks.
- Delete obsolete web DB/storage/auth helper files after imports are gone.
- Verify no Next route handlers remain under `apps/web/src/app/api`.
- Update README to document that Next is now frontend/admin UI plus safe server-action transport only.

Out of scope:

- Removing `apps/web/src/lib/api/admin-auth.ts`, because it is the FastAPI JWT/cookie bridge.
- Removing server actions that provide form redirects, revalidation, or HTTP-only cookie transport.
- Changing FastAPI endpoints or database schema.
- Moving Drizzle migration files out of `apps/web/drizzle` in this phase.

## Files

- Create: `apps/web/src/lib/api/project-types.ts`
- Create: `apps/web/src/lib/api/upload-validation.ts`
- Modify: `apps/web/src/lib/api/admin-projects.ts`
- Modify: `apps/web/src/lib/api/admin-media.ts`
- Modify: `apps/web/src/app/admin/actions.ts`
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx`
- Modify: `apps/web/src/app/admin/components/ProjectSectionForm.tsx`
- Modify if needed: `apps/web/src/app/admin/components/ProjectSectionsEditor.tsx`
- Delete: `apps/web/src/lib/db/client.ts`
- Delete: `apps/web/src/lib/db/queries.ts`
- Delete: `apps/web/src/lib/db/schema.ts`
- Delete: `apps/web/src/lib/storage/s3.ts`
- Delete: `apps/web/src/lib/auth/password.ts`
- Delete: `apps/web/src/lib/auth/session.ts`
- Modify: `README.md`

## Tasks

### Task 1: Frontend-Safe Shared Types

- [ ] Create `apps/web/src/lib/api/project-types.ts` with `mediaUsageScopes`, `MediaUsageScope`, `videoVariants`, `VideoVariant`, `projectSectionTypes`, and `ProjectSectionType`.
- [ ] Update `apps/web/src/lib/api/admin-projects.ts` to import `ProjectSectionType` from `./project-types` instead of `@/lib/db/schema`.
- [ ] Update `apps/web/src/lib/api/admin-media.ts` to import/re-export `MediaUsageScope` and `VideoVariant` from `./project-types` instead of declaring duplicate string unions if duplication exists.
- [ ] Update `apps/web/src/app/admin/components/ProjectSectionForm.tsx` to import `projectSectionTypes` and `ProjectSectionType` from `@/lib/api/project-types` instead of `@/lib/db/schema`.
- [ ] Update any other admin component importing `@/lib/db/schema` for types only to use `@/lib/api/project-types`.
- [ ] Run `rg '@/lib/db/schema' apps/web/src`.
- [ ] Expected: no matches outside deleted/legacy files.
- [ ] Run `npm run lint:web && npm run build:web`.

### Task 2: Frontend-Safe Upload Validation

- [ ] Create `apps/web/src/lib/api/upload-validation.ts` with `IMAGE_MAX_SIZE_BYTES`, `VIDEO_MAX_SIZE_BYTES`, `ALLOWED_UPLOAD_MIME_TYPES`, `validateMediaUploadInput()`, and `validateUploadStorageKey()` copied from the validation-only parts of `apps/web/src/lib/storage/s3.ts`.
- [ ] Do not include AWS SDK imports, S3 clients, signing, object verification, media proxy, or delivery URL generation in the new module.
- [ ] Update `apps/web/src/app/admin/actions.ts` to import `validateMediaUploadInput` and `validateUploadStorageKey` from `@/lib/api/upload-validation` instead of `@/lib/storage/s3`.
- [ ] Confirm `saveMediaAssetAction` does not import or call `verifyUploadedMediaObject` or `getMediaDeliveryUrl`; FastAPI owns storage verification/URLs after Phase 6.
- [ ] Update `apps/web/src/app/admin/components/MediaUploadField.tsx` if it needs allowed MIME constants in the future; do not add new behavior if it does not.
- [ ] Run `rg '@/lib/storage' apps/web/src`.
- [ ] Expected: no matches.
- [ ] Run `node --import tsx apps/web/src/app/admin/upload-actions.test.ts && npm run lint:web && npm run build:web`.

### Task 3: Delete Dead Next Backend Files

- [ ] Run `rg '@/lib/(db|storage|auth)' apps/web/src`.
- [ ] Expected before deletion: no imports from these paths. `@/lib/api/admin-auth` is allowed and should not match this pattern.
- [ ] Delete `apps/web/src/lib/db/client.ts`.
- [ ] Delete `apps/web/src/lib/db/queries.ts`.
- [ ] Delete `apps/web/src/lib/db/schema.ts`.
- [ ] Delete `apps/web/src/lib/storage/s3.ts`.
- [ ] Delete `apps/web/src/lib/auth/password.ts`.
- [ ] Delete `apps/web/src/lib/auth/session.ts`.
- [ ] Run `rg '@/lib/(db|storage|auth)' apps/web/src`.
- [ ] Expected: no matches.
- [ ] Run `rg 'createMediaAsset|createMediaAssets|getAdminMediaAssets|getAdminSiteMediaAssets|getAdminProjectMediaAssets|verifyUploadedMediaObject|getMediaDeliveryUrl|createSignedPutUpload|putMediaObject|deleteMediaObjects' apps/web/src`.
- [ ] Expected: no matches except API client helper names that intentionally call FastAPI, if any.
- [ ] Run `npm run lint:web && npm run build:web`.

### Task 4: Remove Remaining Next API Surface Assumptions

- [ ] Run `rg '/api/uploads/sign|/api/uploads/video|/api/media' apps/web/src apps/web/README.md README.md`.
- [ ] Expected: no source matches. README may mention removed historical routes only if clearly marked as removed; prefer removing stale mentions.
- [ ] Run `find apps/web/src/app/api -name route.ts -print` if the directory exists.
- [ ] Expected: no files. If the directory is empty, leave or remove empty directories according to git status behavior.
- [ ] Check `apps/web/next.config.ts` for server action body-size config and keep it if video upload still forwards through server actions.
- [ ] Run `npm run lint:web && npm run build:web`.

### Task 5: Docs and Full Verification

- [ ] Update `README.md` to document that `apps/web` no longer owns DB/storage/auth backend logic; it renders UI and uses FastAPI clients/server actions for safe cookie transport.
- [ ] Run:

```bash
npm run backend:install
npm run backend:test
node --import tsx apps/web/src/app/admin/upload-actions.test.ts
node --import tsx apps/web/src/app/admin/project-form-errors.test.ts
npm run lint:web
npm run build:web
docker build .
docker compose config
rm -rf apps/backend/.venv
git status --short --untracked-files=all
```

- [ ] Run final grep checks:

```bash
rg '@/lib/(db|storage|auth)' apps/web/src
rg '/api/uploads/sign|/api/uploads/video|/api/media' apps/web/src
```

Expected: both grep commands return no matches.

## Self-Review

- Spec coverage: the plan removes DB, storage, legacy auth, route handler assumptions, and stale docs while preserving FastAPI auth glue and server actions.
- Placeholder scan: no task contains unresolved placeholders or generic instructions without file paths.
- Type consistency: `project-types.ts` is the single frontend-safe source for media and section unions, and `upload-validation.ts` is the single frontend-safe source for upload preflight validation.
