# Dual Video Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store two video variants per upload and show the right variant for parallax versus simple video blocks.

**Architecture:** Add a small `video_variant` column to `media_assets`, save both `scrub` and `standard` variants from the server-side video upload route, and filter admin media selectors by the block type. Existing image and site-media behavior stays unchanged.

**Tech Stack:** Next.js App Router, Route Handlers, FFmpeg, Drizzle ORM, PostgreSQL, S3/MinIO.

---

## Tasks

- [ ] Add `media_assets.video_variant` with values `standard`, `scrub`, or null.
- [ ] Update media asset create types to accept `videoVariant`.
- [ ] Change `/api/uploads/video` to upload two objects: standard with audio and scrub without audio.
- [ ] Update `ProjectSectionForm` media filtering so `parallax_video` shows scrub videos and `video_block` shows standard videos.
- [ ] Update existing optimization script to mark current optimized videos as `scrub`.
- [ ] Run migration, lint, build.
