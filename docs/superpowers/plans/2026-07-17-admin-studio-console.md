# Admin Studio Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the private admin into a Portuguese Studio Console that is easier for a non-technical user to operate.

**Architecture:** Keep the current single admin route and server actions. Improve layout, labels, grouping, summaries, and advanced-field disclosure without changing the database or public routes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, server actions, Drizzle/Postgres.

---

## File Structure

- Modify `src/app/admin/components/AdminShell.tsx`: add the Studio Console layout with Portuguese navigation.
- Modify `src/app/admin/page.tsx`: reorder admin areas to match the new navigation and Portuguese headings.
- Modify `src/app/admin/components/ProjectForm.tsx`: translate labels, clarify media fields, add project preview link.
- Modify `src/app/admin/components/ProjectSectionsEditor.tsx`: translate `Sections` to `Blocos da pagina`, add readable type labels and block summaries, hide metadata in advanced settings.
- Modify `src/app/admin/components/MediaUploadField.tsx`: translate media upload UI and library labels.
- Modify `src/app/admin/components/FeaturedProjectPicker.tsx`: translate featured project UI.
- Modify `src/app/admin/components/ProfileForm.tsx`: translate profile fields.
- Modify `src/app/admin/components/HomepageCopyForm.tsx`: rename to general texts in the UI without renaming the file.

## Task 1: Studio Console Shell

**Files:**
- Modify: `src/app/admin/components/AdminShell.tsx`

- [ ] Replace English title and navigation with Portuguese labels.
- [ ] Use a responsive layout: desktop left sidebar, mobile stacked header.
- [ ] Keep existing status/error rendering.
- [ ] Keep `Public site` behavior as `Ver site`.
- [ ] Keep logout form behavior as `Sair`.
- [ ] Verify focus styles remain visible on links and buttons.

## Task 2: Admin Page Ordering

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] Keep all existing data loading.
- [ ] Reorder sections so the project workflow appears first after the shell.
- [ ] Add anchor ids matching the shell navigation: `inicio`, `projetos`, `midias`, `perfil`.
- [ ] Keep all existing forms rendered so no functionality is lost.

## Task 3: Project Form Language And Preview

**Files:**
- Modify: `src/app/admin/components/ProjectForm.tsx`

- [ ] Translate form title: `Create project` -> `Criar projeto`, `Edit project` -> `Editar projeto`.
- [ ] Translate labels: title, slug, subtitle, category, location, year, description, publish state.
- [ ] Use `Endereco da pagina` for `slug` and add small helper copy explaining it becomes `/projetos/...`.
- [ ] Translate `Client architect` to `Arquiteto responsavel`.
- [ ] Translate media selectors: `Video de abertura`, `Imagem alternativa`, `Imagem do arquiteto`.
- [ ] Add a `Ver pagina do projeto` link for existing projects with a slug.
- [ ] Keep field names unchanged so `saveProjectAction` continues working.

## Task 4: Page Blocks Editor

**Files:**
- Modify: `src/app/admin/components/ProjectSectionsEditor.tsx`

- [ ] Rename UI text from sections to `Blocos da pagina`.
- [ ] Add a local map from section type values to Portuguese labels.
- [ ] Render select options using Portuguese labels while preserving original values.
- [ ] Add a compact block summary with order, translated type, title, media label, and `Visivel` / `Oculto`.
- [ ] Translate field labels: order, type, title, body, primary media, poster image, caption, enabled.
- [ ] Move metadata textarea into a closed `<details>` labelled `Configuracoes avancadas`.
- [ ] Keep delete and save actions intact.

## Task 5: Media, Featured Project, Profile, General Texts

**Files:**
- Modify: `src/app/admin/components/MediaUploadField.tsx`
- Modify: `src/app/admin/components/FeaturedProjectPicker.tsx`
- Modify: `src/app/admin/components/ProfileForm.tsx`
- Modify: `src/app/admin/components/HomepageCopyForm.tsx`

- [ ] Translate media manager to `Fotos e videos`.
- [ ] Translate upload states and error/success messages to Portuguese.
- [ ] Translate media library labels: file, identifying name, send, library, type, open file.
- [ ] Translate featured project picker to `Projeto principal`.
- [ ] Translate profile UI to `Perfil / contato`.
- [ ] Rename homepage copy UI to `Textos gerais` and keep the existing form action.
- [ ] Keep field names and action imports unchanged.

## Task 6: Verification

**Files:**
- Inspect changed admin files.

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `curl -I --max-time 10 http://localhost:3000/admin` and expect redirect to `/admin/login` when unauthenticated.
- [ ] Run `curl -I --max-time 10 http://localhost:3000/projetos/sala-02` and expect `200 OK`.
- [ ] Manually inspect `/admin/login` and `/admin` in browser if a session is available.

## Self Review

- Spec coverage: all approved admin design sections are covered by tasks 1-5.
- Scope check: no database changes, no i18n, no drag-and-drop, no public UX changes.
- Type consistency: field names and server actions remain unchanged.
