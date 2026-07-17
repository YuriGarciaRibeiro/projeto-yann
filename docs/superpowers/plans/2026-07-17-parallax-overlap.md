# Parallax Overlap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cinematic overlap only between consecutive parallax video blocks.

**Architecture:** Detect adjacent rendered project sections in `ProjectPage`, pass an overlap flag into `ProjectSectionRenderer`, and apply a focused CSS class to `ParallaxVideoSection` when the previous rendered section is also `parallax_video`.

**Tech Stack:** Next.js React components, Tailwind utility classes, global CSS media queries.

---

## Tasks

- [x] Update `ProjectPage` to detect previous rendered section type.
- [x] Add `overlapPrevious` prop to `ProjectSectionRenderer`.
- [x] Add `overlapPrevious` prop to `ParallaxVideoSection` and apply an overlap class only there.
- [x] Add responsive/reduced-motion CSS for `.project-parallax-overlap` in `globals.css`.
- [x] Run `npm run lint` and `npm run build`.
