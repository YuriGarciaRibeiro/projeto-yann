# Scrub Scroll Pacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scroll-bound project videos feel faster and less drawn out.

**Architecture:** Adjust the three pacing constants in `ScrollVideoParallax` while preserving the existing duration-based scroll calculation and reduced-motion behavior.

**Tech Stack:** React client component, Framer Motion scroll progress, CSS custom property `--scrub-scroll-height`.

---

## Tasks

- [x] Change `MIN_SCROLL_HEIGHT_SVH` from `520` to `320`.
- [x] Change `MAX_SCROLL_HEIGHT_SVH` from `1100` to `720`.
- [x] Change `SCROLL_HEIGHT_PER_SECOND_SVH` from `110` to `70`.
- [x] Run `npm run lint` and `npm run build`.
