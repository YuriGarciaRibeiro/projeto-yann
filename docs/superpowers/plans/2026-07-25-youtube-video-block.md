# YouTube Video Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the uploaded-file workflow for public `video_block` sections with a YouTube URL embed workflow.

**Architecture:** Store the YouTube URL in existing `section.metadata.youtubeUrl` so no database or backend schema changes are needed. Add a focused URL parser utility with tests, update the admin section form to show a URL field for `video_block`, and update public rendering to use a responsive YouTube iframe when the URL is valid.

**Tech Stack:** Next.js app router, React client components, TypeScript, Node test files run with native type stripping where needed.

---

## File Structure

- Create `apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.ts`: pure helpers to read and convert YouTube URLs into safe embed URLs.
- Create `apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.test.ts`: focused parser tests.
- Modify `apps/web/src/app/components/project-page/section-renderers/VideoBlockSection.tsx`: render a YouTube iframe when metadata contains a valid YouTube URL.
- Modify `apps/web/src/app/admin/components/ProjectSectionForm.tsx`: show a YouTube URL field instead of a primary uploaded video selector for `video_block`, while preserving metadata JSON handling for `technical_info`.
- Modify `apps/web/src/app/admin/actions.ts`: preserve `youtubeUrl` from form data into section metadata.

### Task 1: YouTube Embed Helper

**Files:**
- Create: `apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.ts`
- Test: `apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.test.ts`

- [ ] **Step 1: Write the failing parser tests**

Create `apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.test.ts` with:

```ts
import assert from "node:assert/strict";

import { getYouTubeEmbedUrl } from "./youtubeEmbed.ts";

assert.equal(
  getYouTubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
  "https://www.youtube.com/embed/dQw4w9WgXcQ",
);

assert.equal(
  getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ?si=abc123"),
  "https://www.youtube.com/embed/dQw4w9WgXcQ",
);

assert.equal(
  getYouTubeEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ"),
  "https://www.youtube.com/embed/dQw4w9WgXcQ",
);

assert.equal(getYouTubeEmbedUrl("https://example.com/watch?v=dQw4w9WgXcQ"), null);
assert.equal(getYouTubeEmbedUrl("not a url"), null);
assert.equal(getYouTubeEmbedUrl(null), null);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --experimental-strip-types apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.test.ts`

Expected: FAIL because `youtubeEmbed.ts` does not exist yet.

- [ ] **Step 3: Add the minimal helper implementation**

Create `apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.ts` with:

```ts
const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function getYouTubeEmbedUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  const hostname = url.hostname.replace(/^www\./, "");
  let videoId: string | null = null;

  if (hostname === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (hostname === "youtube.com" || hostname === "m.youtube.com") {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.split("/").filter(Boolean)[1] ?? null;
    }
  }

  if (!videoId || !YOUTUBE_ID_PATTERN.test(videoId)) {
    return null;
  }

  return `https://www.youtube.com/embed/${videoId}`;
}
```

- [ ] **Step 4: Run the parser tests**

Run: `node --experimental-strip-types apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.test.ts`

Expected: PASS with no output.

### Task 2: Admin Form Metadata Field

**Files:**
- Modify: `apps/web/src/app/admin/components/ProjectSectionForm.tsx`
- Modify: `apps/web/src/app/admin/actions.ts`

- [ ] **Step 1: Inspect current section save parsing**

Read `apps/web/src/app/admin/actions.ts` and locate `saveProjectSectionInlineAction`.

- [ ] **Step 2: Update `ProjectSectionForm.tsx` field config**

In `sectionFieldConfig`, add `youtubeUrl?: boolean` to the config type, remove `primaryMedia: "video"` from `video_block`, and set `youtubeUrl: true` for `video_block`.

Use this final `video_block` config:

```ts
  video_block: {
    caption: true,
    text: true,
    youtubeUrl: true,
  },
```

- [ ] **Step 3: Add a hidden YouTube field for non-YouTube sections**

Near the hidden field block, add:

```tsx
        {!fieldConfig.youtubeUrl ? <input name="youtubeUrl" type="hidden" value="" /> : null}
```

Also preserve the current uploaded fallback media id for existing `video_block` edits with a hidden `primaryMediaAssetId` value, while continuing to clear primary media for section types that do not use media.

- [ ] **Step 4: Add the visible YouTube URL input**

Before the media selector block, add:

```tsx
        {fieldConfig.youtubeUrl ? (
          <TextField
            defaultValue={typeof sectionData?.metadata?.youtubeUrl === "string" ? sectionData.metadata.youtubeUrl : ""}
            idPrefix={idPrefix}
            label="URL do YouTube"
            name="youtubeUrl"
          />
        ) : null}
```

- [ ] **Step 5: Update `saveProjectSectionInlineAction` metadata parsing**

In `apps/web/src/app/admin/actions.ts`, after parsing the existing `metadata` JSON, read `youtubeUrl` from form data and merge it only when the section type is `video_block`.

The metadata construction should be equivalent to:

```ts
    const metadata = parseMetadata(formData.get("metadata"));
    const youtubeUrl = getOptionalString(formData.get("youtubeUrl"));
    const sectionMetadata =
      type === "video_block" && youtubeUrl ? { ...metadata, youtubeUrl } : metadata;
```

Then pass `metadata: sectionMetadata` to `upsertAdminProjectSection`.

- [ ] **Step 6: Run TypeScript/lint check**

Run: `npm run lint --workspace apps/web`

Expected: PASS. If this repo has no lint script, run `npm run build --workspace apps/web` and expect a successful build.

### Task 3: Public YouTube Rendering

**Files:**
- Modify: `apps/web/src/app/components/project-page/section-renderers/VideoBlockSection.tsx`

- [ ] **Step 1: Import the helper**

Add:

```ts
import { getYouTubeEmbedUrl } from "./youtubeEmbed";
```

- [ ] **Step 2: Read the embed URL from metadata**

Inside `VideoBlockSection`, after `posterAlt`, add:

```ts
  const youtubeEmbedUrl = getYouTubeEmbedUrl(section.metadata?.youtubeUrl);
```

- [ ] **Step 3: Render the iframe before uploaded video fallback**

Inside the `aspect-video` container, render YouTube first:

```tsx
            {youtubeEmbedUrl ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                src={youtubeEmbedUrl}
                title={videoAlt}
              />
            ) : primaryMediaAsset ? (
```

Keep the existing `primaryMediaAsset`, `posterMediaAsset`, and placeholder branches unchanged after that.

- [ ] **Step 4: Run parser test and project verification**

Run: `node --experimental-strip-types apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.test.ts`

Expected: PASS with no output.

Run: `npm run lint --workspace apps/web`

Expected: PASS. If unavailable, run `npm run build --workspace apps/web`.

### Task 4: Final Verification

**Files:**
- Verify: `apps/web/src/app/admin/components/ProjectSectionForm.tsx`
- Verify: `apps/web/src/app/admin/actions.ts`
- Verify: `apps/web/src/app/components/project-page/section-renderers/VideoBlockSection.tsx`
- Verify: `apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.ts`

- [ ] **Step 1: Run all targeted tests**

Run: `node --experimental-strip-types apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.test.ts`

Expected: PASS with no output.

- [ ] **Step 2: Run app verification**

Run: `npm run lint --workspace apps/web`

Expected: PASS. If the script does not exist, run `npm run build --workspace apps/web` and expect successful compilation.

- [ ] **Step 3: Inspect git diff**

Run: `git diff -- docs/superpowers/specs/2026-07-25-youtube-video-block-design.md docs/superpowers/plans/2026-07-25-youtube-video-block.md apps/web/src/app/admin/components/ProjectSectionForm.tsx apps/web/src/app/admin/actions.ts apps/web/src/app/components/project-page/section-renderers/VideoBlockSection.tsx apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.ts apps/web/src/app/components/project-page/section-renderers/youtubeEmbed.test.ts`

Expected: Diff only contains the spec, plan, YouTube helper/test, admin form save handling, and public video block rendering changes.

---

## Self-Review

- Spec coverage: admin URL field, metadata storage, safe YouTube parsing, public iframe rendering, and parser tests are covered.
- Placeholder scan: no `TBD`, `TODO`, unspecified validation, or deferred implementation remains.
- Type consistency: all references use `metadata.youtubeUrl`, `getYouTubeEmbedUrl`, and the existing `video_block` section type consistently.
