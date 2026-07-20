# Upload Blocking Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a central blocking modal while admin media upload, video conversion, or metadata saving is in progress.

**Architecture:** Reuse the existing `MediaUploadField` busy state and progress `message` state. Render a local overlay/modal inside the component when `isBusy` is true, without introducing a reusable modal abstraction or changing backend/upload behavior.

**Tech Stack:** React client component, Next.js App Router, Tailwind utility classes, Node source guard test, ESLint, Next build.

---

## File Structure

- Modify `apps/web/src/app/admin/components/MediaUploadField.tsx`: render the blocking modal from existing `isBusy` and `message` state.
- Modify `apps/web/src/app/admin/upload-actions.test.ts`: add source assertions that the upload component includes an accessible busy dialog.

## Task 1: Blocking Upload Modal

**Files:**
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx`
- Test: `apps/web/src/app/admin/upload-actions.test.ts`

- [ ] **Step 1: Read current Next.js docs before editing frontend code**

Run: `ls node_modules/next/dist/docs`

Expected: directory listing exists. Then read the local docs relevant to App Router client/server components before editing, because this repository requires checking current Next.js docs.

- [ ] **Step 2: Write the failing guard test**

In `apps/web/src/app/admin/upload-actions.test.ts`, add these assertions after the existing `mediaUploadFieldSource` assertions:

```ts
assert.equal(
  mediaUploadFieldSource.includes('role="dialog"'),
  true,
  "media upload must render an accessible blocking dialog while busy",
);

assert.equal(
  mediaUploadFieldSource.includes('aria-modal="true"'),
  true,
  "upload blocking dialog must be modal for assistive technology",
);

assert.equal(
  mediaUploadFieldSource.includes("Processando envio"),
  true,
  "upload blocking dialog must show a clear processing title",
);

assert.equal(
  mediaUploadFieldSource.includes("Não feche esta aba até o processamento terminar."),
  true,
  "upload blocking dialog must warn the admin not to close the tab",
);
```

- [ ] **Step 3: Run the guard test and verify it fails**

Run: `node --import tsx apps/web/src/app/admin/upload-actions.test.ts`

Expected: FAIL because `MediaUploadField` does not yet include the blocking dialog strings/attributes.

- [ ] **Step 4: Render the blocking modal**

In `apps/web/src/app/admin/components/MediaUploadField.tsx`, add this JSX immediately before the closing `</section>` of the component, after the library block:

```tsx
      {isBusy ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div
            aria-labelledby="media-upload-progress-title"
            aria-modal="true"
            className="w-full max-w-md border border-neutral-950 bg-white p-6 shadow-2xl md:p-8"
            role="dialog"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Upload em andamento</p>
            <h2
              className="mt-3 text-2xl font-normal tracking-[-0.03em] text-neutral-950"
              id="media-upload-progress-title"
            >
              Processando envio
            </h2>
            <p className="mt-5 border border-neutral-200 px-4 py-3 text-sm text-neutral-700" role="status">
              {message || "Preparando envio..."}
            </p>
            <p className="mt-4 text-xs leading-5 text-neutral-500">
              Não feche esta aba até o processamento terminar.
            </p>
          </div>
        </div>
      ) : null}
```

Do not add a cancel button. Do not change upload state transitions. Do not remove the existing inline message; it should remain for success/error after the modal closes.

- [ ] **Step 5: Run the guard test and verify it passes**

Run: `node --import tsx apps/web/src/app/admin/upload-actions.test.ts`

Expected: PASS.

- [ ] **Step 6: Run lint and build**

Run: `npm run lint`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add apps/web/src/app/admin/components/MediaUploadField.tsx apps/web/src/app/admin/upload-actions.test.ts
git commit -m "feat: block admin during media uploads"
```

## Self-Review

- Spec coverage: The plan implements a central blocking modal tied to existing `isBusy`, reuses `message`, includes the required note, keeps inline messages, avoids cancel behavior, and does not touch backend behavior.
- Placeholder scan: No placeholders or deferred implementation steps remain.
- Type consistency: No new types are introduced; existing `isBusy` and `message` state are used directly.
