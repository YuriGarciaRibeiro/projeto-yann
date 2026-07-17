# Admin Project Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the admin into a project list, a new project page, and a single-project edit page.

**Architecture:** Keep one shared `AdminShell` and existing form components. Move page composition into separate App Router routes, add a single-project query helper, and adjust project saving so newly created projects redirect to their edit route.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, server actions, Drizzle/Postgres.

---

## File Structure

- Modify `src/app/admin/page.tsx`: become project list plus site/profile areas.
- Create `src/app/admin/projetos/novo/page.tsx`: new project page.
- Create `src/app/admin/projetos/[id]/page.tsx`: edit one project page.
- Modify `src/app/admin/actions.ts`: redirect newly created projects to edit page.
- Modify `src/lib/db/queries.ts`: add `getAdminProjectById()` helper.
- Modify `src/app/admin/components/AdminShell.tsx`: update nav links to route paths instead of only anchors.
- Optionally create `src/app/admin/components/ProjectList.tsx`: focused list component if `page.tsx` gets too large.

## Task 1: Query Helper

**Files:**
- Modify: `src/lib/db/queries.ts`

- [ ] Add `getAdminProjectById(projectId: string)` returning one project or null.
- [ ] Keep `getAdminProjects()` unchanged for the list page.

## Task 2: Save Project Redirect

**Files:**
- Modify: `src/app/admin/actions.ts`

- [ ] Update `saveProjectAction` so creating a new project redirects to `/admin/projetos/[id]?status=Projeto%20criado.`.
- [ ] Updating an existing project can redirect back to `/admin/projetos/[id]?status=Projeto%20salvo.`.
- [ ] Keep form field names and validation unchanged.

## Task 3: Admin List Page

**Files:**
- Modify: `src/app/admin/page.tsx`
- Optional create: `src/app/admin/components/ProjectList.tsx`

- [ ] Remove per-project full editors from `/admin`.
- [ ] Show project list with title, year, published status, featured status, edit link, and public link.
- [ ] Add `Criar novo projeto` link to `/admin/projetos/novo`.
- [ ] Keep `FeaturedProjectPicker`, site media upload, `ProfileForm`, and `HomepageCopyForm` on `/admin`.

## Task 4: New Project Route

**Files:**
- Create: `src/app/admin/projetos/novo/page.tsx`

- [ ] Require admin session using the same cookie/session pattern.
- [ ] Render `AdminShell`.
- [ ] Render heading `Criar novo projeto`.
- [ ] Render `ProjectForm mediaAssets={[]}`.
- [ ] Add link back to `/admin`.

## Task 5: Edit Project Route

**Files:**
- Create: `src/app/admin/projetos/[id]/page.tsx`

- [ ] Require admin session using the same cookie/session pattern.
- [ ] Load project by id; call `notFound()` if missing.
- [ ] Load project media and project sections for that project.
- [ ] Render `AdminShell`.
- [ ] Render link back to `/admin`.
- [ ] Render project-specific `MediaUploadField`.
- [ ] Render `ProjectForm` for this project using only project media.
- [ ] Render `ProjectSectionsEditor` for this project using only project media.

## Task 6: Shell Navigation

**Files:**
- Modify: `src/app/admin/components/AdminShell.tsx`

- [ ] Change `Projetos` nav link to `/admin`.
- [ ] Change `Fotos e vídeos` link to `/admin#midias`.
- [ ] Change `Perfil / contato` link to `/admin#perfil`.
- [ ] Keep `Ver site` and `Sair`.

## Task 7: Verification

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `curl -I --max-time 10 http://localhost:3000/admin` and expect redirect to `/admin/login` unauthenticated.
- [ ] Run `curl -I --max-time 10 http://localhost:3000/admin/projetos/novo` and expect redirect to `/admin/login` unauthenticated.
- [ ] Run `curl -I --max-time 10 http://localhost:3000/projetos/sala-02` and expect `200 OK`.

## Self Review

- Spec coverage: list, new page, edit page, redirect behavior, auth, and existing site/profile areas are covered.
- Scope check: no public UX changes, no database changes, no drag and drop.
- Type consistency: project id route uses `params.id`; public project route remains slug-based.
