# Project Preloader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal entry loader for project pages that waits briefly for the first hero media to be ready.

**Architecture:** Add a small client component wrapping the project page content. It receives hero media URLs from the server-rendered project page and controls an overlay without changing the existing media renderers.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4.

---

## Task 1: Project Preloader Component

**Files:**
- Create: `src/app/components/project-page/ProjectPreloader.tsx`
- Modify: `src/app/components/project-page/ProjectPage.tsx`

- [ ] Add a client component that renders children plus an overlay.
- [ ] Preload hero poster with `new Image()` when present.
- [ ] On non-reduced-motion fine pointers, preload hero video metadata/canplay with a detached `video` element when present.
- [ ] Reveal after media readiness or 3500ms timeout.
- [ ] Render a minimal black overlay with `Yann`, project title, and a restrained progress line.
- [ ] Do not block forever on errors.

## Task 2: Verification

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Check `http://localhost:3000/projetos/sala-02` returns `200 OK`.
