# Project Section Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make public project pages transition more fluidly between blocks and ensure the opening hero video uses the optimized scrub variant.

**Architecture:** Add reusable editorial transition CSS classes, apply them to existing section renderers with minimal structural changes, and harden the hero video query/form validation around `videoVariant = "scrub"`.

**Tech Stack:** Next.js App Router, Tailwind CSS utility classes, Drizzle ORM query joins.

---

## Tasks

- [x] Add shared section-flow CSS classes in `src/app/globals.css`.
- [x] Apply softer section transition classes to hero and section renderers.
- [x] Ensure hero media query only joins `scrub` video assets.
- [x] Ensure project save rejects non-optimized hero videos.
- [x] Run `npm run lint` and `npm run build`.
