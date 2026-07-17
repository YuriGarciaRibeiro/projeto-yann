# Project Form Inline Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show project creation/editing errors inline in Portuguese without navigating away from the current form.

**Architecture:** Add a non-redirecting project form server action that returns field errors, convert `ProjectForm` to a client component using `useActionState`, and keep the existing redirect-based behavior only for success. Server-side validation remains authoritative.

**Tech Stack:** Next.js App Router, React 19 `useActionState`, Server Actions, Drizzle ORM.

---

## Tasks

- [x] Add `ProjectFormState` and `saveProjectFormAction` in `src/app/admin/actions.ts`.
- [x] Map validation/database errors to Portuguese field errors.
- [x] Convert `src/app/admin/components/ProjectForm.tsx` to a client component using `useActionState`.
- [x] Render per-field errors below inputs/selects/textareas.
- [x] Preserve entered values through action state.
- [x] Run lint/build.
