# Multi-File Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Yann upload multiple media files at once without manually naming them, while showing video variants as one logical file in the admin.

**Architecture:** Update `MediaUploadField` only. Derive display names from file names, process selected files sequentially, keep existing upload endpoints/actions, and group the library list by normalized base name plus media kind.

**Tech Stack:** Next.js App Router, React client component, existing signed upload route, existing video upload route, existing `media_assets` schema.

---

## Tasks

- [x] Update `src/app/admin/components/MediaUploadField.tsx` to derive names from selected file names.
- [x] Enable multiple file selection and sequential upload processing.
- [x] Remove the manual name input from the UI.
- [x] Group video variants visually in the library list.
- [x] Keep selectors unchanged because they already filter the correct internal variant.
- [x] Run `npm run lint` and `npm run build`.
