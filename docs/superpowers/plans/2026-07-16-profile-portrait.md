# Profile Portrait Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin choose an uploaded image as Yann's profile portrait and show it in the public profile section.

**Architecture:** Add an optional `portraitImageAssetId` relation from `site_profile` to `media_assets`. Reuse the existing media upload/listing flow and validate that the selected portrait is an image on the server before saving.

**Tech Stack:** Next.js 16, TypeScript, Drizzle/Postgres, existing S3 media upload system, Tailwind CSS 4.

---

## Task 1: Data And Queries

**Files:**
- Modify: `src/lib/db/schema.ts`
- Modify: `src/lib/db/queries.ts`
- Modify: `scripts/seed.ts`
- Generate: `drizzle/*`

- [ ] Add nullable `portraitImageAssetId` to `site_profile`, referencing `media_assets.id` with `onDelete: "set null"`.
- [ ] Extend `SiteProfileUpdate` and `upsertSiteProfile` to accept `portraitImageAssetId`.
- [ ] Add server-side validation that `portraitImageAssetId` is null or an image media asset.
- [ ] Extend homepage query to return the portrait media asset with the profile.
- [ ] Update seed to preserve or initialize `portraitImageAssetId` as null.
- [ ] Run `npm run db:generate`.

## Task 2: Admin Form

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/actions.ts`
- Modify: `src/app/admin/components/ProfileForm.tsx`

- [ ] Pass media assets into `ProfileForm`.
- [ ] Add a `Portrait image` select filtered to `image/*` assets.
- [ ] Parse `portraitImageAssetId` in `saveProfileAction` and save it with profile data.

## Task 3: Public Profile Section

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/components/ProfileSection.tsx`

- [ ] Pass the selected portrait image to `ProfileSection`.
- [ ] Render an editorial image block when present.
- [ ] Keep the profile section complete when no portrait is selected.

## Task 4: Verification

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `npm run db:migrate` locally.
- [ ] Run `npm run seed` locally.
