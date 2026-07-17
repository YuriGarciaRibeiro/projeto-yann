# Scrub Scroll Pacing 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scroll-bound videos slightly faster again after the first pacing reduction.

**Architecture:** Adjust only the pacing constants in `ScrollVideoParallax`, preserving the same scroll-duration formula and video scrub behavior.

**Tech Stack:** React client component, Framer Motion scroll progress.

---

## Tasks

- [x] Change `MIN_SCROLL_HEIGHT_SVH` from `320` to `260`.
- [x] Change `MAX_SCROLL_HEIGHT_SVH` from `720` to `600`.
- [x] Change `SCROLL_HEIGHT_PER_SECOND_SVH` from `70` to `55`.
- [x] Run `npm run lint` and `npm run build`.
