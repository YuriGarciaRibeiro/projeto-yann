# Docker Private Repo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the app to run in Docker for external testing and create a private GitHub repository named `projeto-yann`.

**Architecture:** Add a production Dockerfile with FFmpeg support, ignore unsafe/heavy files via `.dockerignore`, add an optional `web` service to `docker-compose.yml`, and create the private GitHub repo without pushing code unless explicitly requested.

**Tech Stack:** Next.js, Node 24 Alpine, Docker, Docker Compose, FFmpeg, GitHub CLI.

---

## Tasks

- [x] Add `.dockerignore` excluding secrets, dependencies, build output, local media, and tool state.
- [x] Add production `Dockerfile` with dependency, build, and runtime stages plus FFmpeg.
- [x] Update `docker-compose.yml` with a `web` service wired to local Postgres and MinIO.
- [x] Run `npm run lint`, `npm run build`, and `docker build`.
- [x] Create private GitHub repository `projeto-yann`.
