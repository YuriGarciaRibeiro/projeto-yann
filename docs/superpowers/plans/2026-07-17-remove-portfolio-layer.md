# Remove Portfolio Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the old Yann portfolio/institutional layer and keep the app focused on project pages and project administration.

**Architecture:** Delete unused homepage/profile/featured code paths, remove `site_profile` and `projects.is_featured`, simplify `/admin` to project management plus global media, and simplify seed to create only the admin user. Keep public `/projetos/[slug]` and project-scoped editing intact.

**Tech Stack:** Next.js App Router, Drizzle ORM, PostgreSQL, S3/MinIO.

---

## Tasks

- [ ] Remove `site_profile` schema and `isFeatured` project field.
- [ ] Remove homepage/profile/featured query and action functions.
- [ ] Simplify admin overview and shell labels.
- [ ] Delete old portfolio-only components/forms.
- [ ] Simplify root `/` empty state and metadata copy.
- [ ] Simplify seed to admin user only.
- [ ] Generate/apply migration and run lint/build.
