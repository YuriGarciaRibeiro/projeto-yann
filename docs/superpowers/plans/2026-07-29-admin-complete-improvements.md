# Admin Complete Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the existing private admin with accessibility fixes, safer actions, client-side filtering, better media readability, and small navigation/theme improvements without changing backend contracts.

**Architecture:** Keep server routes and data fetching as-is. Add small client-side helpers/components around already-loaded project and media arrays, and make targeted fixes in existing admin components instead of redesigning route structure.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, shadcn/Base UI components, Tailwind CSS 4, existing server actions and API helpers.

---

## File Structure

- Modify `apps/web/src/components/ui/button.tsx`: replace `transition-all` with explicit transition properties.
- Modify `apps/web/src/app/admin/components/AdminThemeProvider.tsx`: sync admin theme with document-level `colorScheme` while mounted.
- Modify `apps/web/src/app/admin/components/AdminNavigation.tsx`: add a global media sidebar link using the existing hash-aware active state.
- Modify `apps/web/src/app/admin/page.tsx`: use `h1`, add safe external link attributes, and move the project table into a filterable client component.
- Create `apps/web/src/app/admin/components/ProjectList.tsx`: client-side project search/status filtering and project table rendering.
- Modify `apps/web/src/app/admin/projetos/novo/page.tsx`: use `h1`.
- Modify `apps/web/src/app/admin/projetos/[id]/page.tsx`: use `h1` and safe external link attributes.
- Modify `apps/web/src/app/admin/components/ProjectForm.tsx`: safe external link attributes, first-error focus, email spellcheck, and small form accessibility fixes.
- Modify `apps/web/src/app/admin/components/ProjectSectionForm.tsx`: URL input type for YouTube and small field attribute fixes.
- Modify `apps/web/src/app/admin/components/MediaUploadField.tsx`: file input name, media search/type filtering, image thumbnail/video placeholder, size/date formatting, filtered empty state.
- Modify `apps/web/src/app/admin/components/DeleteProjectForm.tsx`: require typing the exact project title before submitting delete.

No unit test files are created, modified, or run in this plan because the user explicitly prefers not to create, modify, or run unit tests unless asked.

## Task 1: Correct Shared Button Transition

**Files:**
- Modify: `apps/web/src/components/ui/button.tsx:6-7`

- [ ] **Step 1: Replace `transition-all` with explicit transition properties**

Change the base class string in `buttonVariants` from:

```tsx
"group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
```

to:

```tsx
"group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
```

- [ ] **Step 2: Verify no admin regression from the class change**

Run:

```bash
npm run lint:web
```

Expected: lint completes without errors from `button.tsx`.

## Task 2: Improve Admin Theme Browser Integration

**Files:**
- Modify: `apps/web/src/app/admin/components/AdminThemeProvider.tsx:3-33`

- [ ] **Step 1: Import `useEffect`**

Change:

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";
```

to:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
```

- [ ] **Step 2: Sync `document.documentElement.style.colorScheme` while the admin theme provider is mounted**

Add this inside `AdminThemeProvider`, after `setTheme` and before `const value`:

```tsx
  useEffect(() => {
    const root = document.documentElement;
    const previousColorScheme = root.style.colorScheme;

    root.style.colorScheme = theme;

    return () => {
      root.style.colorScheme = previousColorScheme;
    };
  }, [theme]);
```

- [ ] **Step 3: Keep the existing provider API unchanged**

Do not rename `AdminThemeProvider`, `useAdminTheme`, `theme`, or `setTheme`. Existing consumers in `AdminThemeToggle` must continue to compile.

## Task 3: Add Global Media Navigation

**Files:**
- Modify: `apps/web/src/app/admin/components/AdminNavigation.tsx:3-21`

- [ ] **Step 1: Import a media icon**

Change:

```tsx
import { FolderKanbanIcon, PlusIcon, type LucideIcon } from "lucide-react";
```

to:

```tsx
import { FolderKanbanIcon, ImagesIcon, PlusIcon, type LucideIcon } from "lucide-react";
```

- [ ] **Step 2: Add the media hash link to `adminNavItems`**

Change:

```tsx
const adminNavItems = [
  { href: "/admin", icon: FolderKanbanIcon, label: "Projetos" },
  { href: "/admin/projetos/novo", icon: PlusIcon, label: "Novo projeto" },
] satisfies Array<{ href: string; icon: LucideIcon; label: string }>;
```

to:

```tsx
const adminNavItems = [
  { href: "/admin", icon: FolderKanbanIcon, label: "Projetos" },
  { href: "/admin#midias", icon: ImagesIcon, label: "Mídias globais" },
  { href: "/admin/projetos/novo", icon: PlusIcon, label: "Novo projeto" },
] satisfies Array<{ href: string; icon: LucideIcon; label: string }>;
```

- [ ] **Step 3: Confirm existing hash active-state logic handles the new link**

No code change is needed in `isAdminNavActive`; it already splits `href` by `#` and compares the current hash.

## Task 4: Extract Filterable Project List

**Files:**
- Create: `apps/web/src/app/admin/components/ProjectList.tsx`
- Modify: `apps/web/src/app/admin/page.tsx:5-37, 67-74, 86-173`

- [ ] **Step 1: Create `ProjectList.tsx` as a client component**

Create `apps/web/src/app/admin/components/ProjectList.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminProject } from "@/lib/api/admin-projects";

type ProjectStatusFilter = "all" | "published" | "draft";

const statusOptions = [
  { label: "Todos", value: "all" },
  { label: "Publicados", value: "published" },
  { label: "Rascunhos", value: "draft" },
] satisfies Array<{ label: string; value: ProjectStatusFilter }>;

function getProjectSearchText(project: AdminProject) {
  return [
    project.title,
    project.slug,
    project.location,
    project.category,
    project.year,
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLocaleLowerCase("pt-BR");
}

function matchesProjectStatus(project: AdminProject, status: ProjectStatusFilter) {
  if (status === "published") {
    return project.isPublished;
  }

  if (status === "draft") {
    return !project.isPublished;
  }

  return true;
}

export function ProjectList({ projects }: { projects: AdminProject[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProjectStatusFilter>("all");
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const filteredProjects = projects.filter((project) => {
    const matchesQuery = normalizedQuery
      ? getProjectSearchText(project).includes(normalizedQuery)
      : true;

    return matchesQuery && matchesProjectStatus(project, status);
  });

  return (
    <Card>
      <CardHeader className="gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-2">
          <CardTitle className="text-admin-section-title font-normal tracking-[-0.02em]">Lista de projetos</CardTitle>
          <CardDescription className="max-w-2xl text-admin-body leading-6">
            Entre em um projeto para editar seus dados, arquivos e blocos da página.
          </CardDescription>
        </div>
        <CardAction className="col-auto row-auto justify-self-start md:justify-self-end">
          <Link className={buttonVariants()} href="/admin/projetos/novo">
            Criar novo projeto
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {projects.length > 0 ? (
          <>
            <FieldGroup className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
              <Field>
                <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor="project-search">
                  Buscar projetos
                </FieldLabel>
                <Input
                  autoComplete="off"
                  id="project-search"
                  name="projectSearch"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Casa branca…"
                  type="search"
                  value={query}
                />
              </Field>
              <Field>
                <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor="project-status-filter">
                  Status
                </FieldLabel>
                <Select
                  items={statusOptions}
                  name="projectStatusFilter"
                  onValueChange={(value) => setStatus(value as ProjectStatusFilter)}
                  value={status}
                >
                  <SelectTrigger className="w-full" id="project-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            {filteredProjects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="min-w-56 whitespace-normal font-display text-admin-card-title font-normal tracking-[-0.04em]">
                        {project.title}
                      </TableCell>
                      <TableCell>{project.year}</TableCell>
                      <TableCell>
                        <Badge variant={project.isPublished ? "default" : "secondary"}>
                          {project.isPublished ? "Publicado" : "Rascunho"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                          <Link className={buttonVariants()} href={`/admin/projetos/${project.id}`}>
                            Editar
                          </Link>
                          {project.isPublished ? (
                            <Link
                              className={buttonVariants({ variant: "outline" })}
                              href={`/projetos/${project.slug}`}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Ver página
                            </Link>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>Nenhum projeto encontrado</EmptyTitle>
                  <EmptyDescription>
                    Ajuste a busca ou o filtro de status para ver outros projetos.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Nenhum projeto criado ainda</EmptyTitle>
              <EmptyDescription>
                Crie o primeiro projeto para começar a montar uma página pública com fotos, vídeos e blocos.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link className={buttonVariants()} href="/admin/projetos/novo">
                Criar projeto
              </Link>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Simplify imports in `page.tsx`**

Remove imports for `Link`, `Badge`, `buttonVariants`, card, empty, table, and `type AdminProject` from `apps/web/src/app/admin/page.tsx`.

Keep:

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  verifyAdminAccessToken,
} from "@/lib/api/admin-auth";
import { getAdminSiteMediaAssets } from "@/lib/api/admin-media";
import { getAdminProjects } from "@/lib/api/admin-projects";

import { MediaUploadField } from "./components/MediaUploadField";
import { ProjectList } from "./components/ProjectList";
```

- [ ] **Step 3: Use `h1` for the admin landing title**

Change the title block in `page.tsx` from:

```tsx
<h2 className="mt-2 font-display text-admin-page-title font-normal tracking-[-0.04em]">
  Páginas de projeto
</h2>
```

to:

```tsx
<h1 className="mt-2 font-display text-admin-page-title font-normal tracking-[-0.04em]">
  Páginas de projeto
</h1>
```

- [ ] **Step 4: Delete the old inline `ProjectList` function from `page.tsx`**

Remove everything from:

```tsx
function ProjectList({ projects }: { projects: AdminProject[] }) {
```

through the end of that function. `AdminPage` should still render:

```tsx
<ProjectList projects={projects} />
```

## Task 5: Fix Page Headings And External Links

**Files:**
- Modify: `apps/web/src/app/admin/projetos/novo/page.tsx:31-34`
- Modify: `apps/web/src/app/admin/projetos/[id]/page.tsx:63-76`
- Modify: `apps/web/src/app/admin/components/ProjectForm.tsx:87-93`

- [ ] **Step 1: Use `h1` on the new project page**

Change in `apps/web/src/app/admin/projetos/novo/page.tsx`:

```tsx
<h2 className="mt-2 font-display text-admin-page-title font-normal tracking-[-0.04em]">
  Criar novo projeto
</h2>
```

to:

```tsx
<h1 className="mt-2 font-display text-admin-page-title font-normal tracking-[-0.04em]">
  Criar novo projeto
</h1>
```

- [ ] **Step 2: Use `h1` on the edit project page**

Change in `apps/web/src/app/admin/projetos/[id]/page.tsx`:

```tsx
<h2 className="mt-2 font-display text-admin-page-title font-normal tracking-[-0.04em]">
  {project.title}
</h2>
```

to:

```tsx
<h1 className="mt-2 font-display text-admin-page-title font-normal tracking-[-0.04em]">
  {project.title}
</h1>
```

- [ ] **Step 3: Add `rel="noreferrer"` to external project links**

In `apps/web/src/app/admin/projetos/[id]/page.tsx`, change:

```tsx
<Link
  className={buttonVariants()}
  href={`/projetos/${project.slug}`}
  target="_blank"
>
```

to:

```tsx
<Link
  className={buttonVariants()}
  href={`/projetos/${project.slug}`}
  rel="noreferrer"
  target="_blank"
>
```

In `apps/web/src/app/admin/components/ProjectForm.tsx`, change:

```tsx
<Link
  className={buttonVariants({ variant: "outline" })}
  href={`/projetos/${project.slug}`}
  target="_blank"
>
```

to:

```tsx
<Link
  className={buttonVariants({ variant: "outline" })}
  href={`/projetos/${project.slug}`}
  rel="noreferrer"
  target="_blank"
>
```

## Task 6: Improve Project Form Error Focus And Field Attributes

**Files:**
- Modify: `apps/web/src/app/admin/components/ProjectForm.tsx:4-5, 50-75, 98-107, 187-194, 287-321`

- [ ] **Step 1: Import `useEffect` and `useRef`**

Change:

```tsx
import { useActionState } from "react";
```

to:

```tsx
import { useActionState, useEffect, useRef } from "react";
```

- [ ] **Step 2: Add a form ref and first-error focus effect**

Inside `ProjectForm`, after `const fieldErrors = state.fieldErrors;`, add:

```tsx
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const firstErrorField = Object.keys(fieldErrors)[0];

    if (!firstErrorField) {
      return;
    }

    const field = formRef.current?.elements.namedItem(firstErrorField);

    if (field instanceof HTMLElement) {
      field.focus();
    }
  }, [fieldErrors]);
```

- [ ] **Step 3: Attach the ref to the form**

Change:

```tsx
<form action={formAction} key={state.submissionKey} noValidate>
```

to:

```tsx
<form action={formAction} key={state.submissionKey} noValidate ref={formRef}>
```

- [ ] **Step 4: Disable spellcheck on the architect email field**

Change the `clientArchitectEmail` field call to include `spellCheck={false}`:

```tsx
<TextField
  defaultValue={fieldValue("clientArchitectEmail")}
  error={fieldErrors.clientArchitectEmail}
  idPrefix={idPrefix}
  label="E-mail"
  name="clientArchitectEmail"
  spellCheck={false}
  type="email"
/>
```

- [ ] **Step 5: Add `spellCheck` support to `TextField`**

Update the `TextField` signature and props from:

```tsx
function TextField({
  defaultValue = "",
  error,
  helpText,
  idPrefix,
  label,
  name,
  required = false,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
  helpText?: string;
  idPrefix: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
```

to:

```tsx
function TextField({
  defaultValue = "",
  error,
  helpText,
  idPrefix,
  label,
  name,
  required = false,
  spellCheck,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
  helpText?: string;
  idPrefix: string;
  label: string;
  name: string;
  required?: boolean;
  spellCheck?: boolean;
  type?: string;
}) {
```

Then add `spellCheck={spellCheck}` to the `<Input />` props:

```tsx
<Input
  aria-invalid={Boolean(error) || undefined}
  autoComplete="off"
  defaultValue={defaultValue}
  id={id}
  name={name}
  required={required}
  spellCheck={spellCheck}
  type={type}
/>
```

## Task 7: Fix Section Form Field Types

**Files:**
- Modify: `apps/web/src/app/admin/components/ProjectSectionForm.tsx:305-315, 460-484`

- [ ] **Step 1: Pass URL type to the YouTube field**

Change:

```tsx
<TextField
  defaultValue={
    typeof sectionData?.metadata?.youtubeUrl === "string"
      ? sectionData.metadata.youtubeUrl
      : ""
  }
  idPrefix={idPrefix}
  label="URL do YouTube"
  name="youtubeUrl"
/>
```

to:

```tsx
<TextField
  defaultValue={
    typeof sectionData?.metadata?.youtubeUrl === "string"
      ? sectionData.metadata.youtubeUrl
      : ""
  }
  idPrefix={idPrefix}
  label="URL do YouTube"
  name="youtubeUrl"
  type="url"
/>
```

- [ ] **Step 2: Add `type` support to the local `TextField` helper**

Change the helper signature from:

```tsx
function TextField({
  defaultValue = "",
  idPrefix,
  label,
  name,
}: {
  defaultValue?: string;
  idPrefix: string;
  label: string;
  name: string;
}) {
```

to:

```tsx
function TextField({
  defaultValue = "",
  idPrefix,
  label,
  name,
  type = "text",
}: {
  defaultValue?: string;
  idPrefix: string;
  label: string;
  name: string;
  type?: string;
}) {
```

Then change the `<Input />` prop from:

```tsx
type="text"
```

to:

```tsx
type={type}
```

## Task 8: Add Media Library Filtering And Metadata Display

**Files:**
- Modify: `apps/web/src/app/admin/components/MediaUploadField.tsx:3-4, 17-18, 39-48, 155-172, 356-459`

- [ ] **Step 1: Import a video/file icon**

Add this import near the top:

```tsx
import { FileVideoIcon } from "lucide-react";
```

- [ ] **Step 2: Add media filter types and format helpers above `MediaUploadField`**

Add after `type PendingDeleteAsset`:

```tsx
type MediaTypeFilter = "all" | "images" | "videos";

const mediaTypeOptions = [
  { label: "Todos", value: "all" },
  { label: "Imagens", value: "images" },
  { label: "Vídeos", value: "videos" },
] satisfies Array<{ label: string; value: MediaTypeFilter }>;

function formatFileSize(sizeBytes: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    style: "unit",
    unit: sizeBytes >= 1_000_000 ? "megabyte" : "kilobyte",
    unitDisplay: "short",
  }).format(sizeBytes >= 1_000_000 ? sizeBytes / 1_000_000 : sizeBytes / 1_000);
}

function formatUploadDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

function matchesMediaType(mimeType: string, type: MediaTypeFilter) {
  if (type === "images") {
    return mimeType.startsWith("image/");
  }

  if (type === "videos") {
    return mimeType.startsWith("video/");
  }

  return true;
}
```

- [ ] **Step 3: Add filter state inside `MediaUploadField`**

After existing `useState` calls, add:

```tsx
  const [libraryQuery, setLibraryQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>("all");
```

- [ ] **Step 4: Derive filtered library items**

After `const libraryItems = getLibraryItems(mediaAssets);`, add:

```tsx
  const normalizedLibraryQuery = libraryQuery.trim().toLocaleLowerCase("pt-BR");
  const filteredLibraryItems = libraryItems.filter((item) => {
    const matchesQuery = normalizedLibraryQuery
      ? [item.displayName, item.mimeType, item.usageScope, item.url]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedLibraryQuery)
      : true;

    return matchesQuery && matchesMediaType(item.mimeType, mediaTypeFilter);
  });
```

- [ ] **Step 5: Add `name` to file input**

Change:

```tsx
<Input
  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
  disabled={isMutating}
  id="media-upload-file"
  multiple
  ref={fileInputRef}
  type="file"
/>
```

to:

```tsx
<Input
  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
  disabled={isMutating}
  id="media-upload-file"
  multiple
  name="mediaFiles"
  ref={fileInputRef}
  type="file"
/>
```

- [ ] **Step 6: Add library controls before the media table**

Inside the library `<div className="flex flex-col gap-3">`, after the `<h3>Biblioteca</h3>`, add:

```tsx
{mediaAssets.length > 0 ? (
  <FieldGroup className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
    <Field>
      <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor={`${usageScope}-media-search`}>
        Buscar mídia
      </FieldLabel>
      <Input
        autoComplete="off"
        id={`${usageScope}-media-search`}
        name="mediaSearch"
        onChange={(event) => setLibraryQuery(event.target.value)}
        placeholder="Sala principal…"
        type="search"
        value={libraryQuery}
      />
    </Field>
    <Field>
      <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor={`${usageScope}-media-type`}>
        Tipo
      </FieldLabel>
      <Select
        items={mediaTypeOptions}
        name="mediaTypeFilter"
        onValueChange={(value) => setMediaTypeFilter(value as MediaTypeFilter)}
        value={mediaTypeFilter}
      >
        <SelectTrigger className="w-full" id={`${usageScope}-media-type`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {mediaTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  </FieldGroup>
) : null}
```

- [ ] **Step 7: Render filtered media rows with preview and metadata**

Change the table condition from `mediaAssets.length > 0 ?` to `mediaAssets.length > 0 ?`, but inside that branch render `filteredLibraryItems.length > 0 ? <Table>...` and map `filteredLibraryItems` instead of `libraryItems`.

Use this table head:

```tsx
<TableHeader>
  <TableRow>
    <TableHead>Arquivo</TableHead>
    <TableHead>Tipo</TableHead>
    <TableHead>Uso</TableHead>
    <TableHead>Tamanho</TableHead>
    <TableHead>Envio</TableHead>
    <TableHead className="text-right">Ações</TableHead>
  </TableRow>
</TableHeader>
```

Use this first table cell for preview and name:

```tsx
<TableCell className="min-w-72 whitespace-normal">
  <div className="flex min-w-0 items-center gap-3">
    {item.mimeType.startsWith("image/") ? (
      <img
        alt=""
        className="size-12 shrink-0 rounded-md border border-border object-cover"
        height={48}
        loading="lazy"
        src={item.url}
        width={48}
      />
    ) : (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
        <FileVideoIcon aria-hidden="true" className="size-5" />
      </div>
    )}
    <span className="min-w-0 break-words font-medium">{item.displayName}</span>
  </div>
</TableCell>
```

Add these metadata cells before the actions cell:

```tsx
<TableCell className="tabular-nums">{formatFileSize(item.sizeBytes)}</TableCell>
<TableCell className="tabular-nums">{formatUploadDate(item.createdAt)}</TableCell>
```

- [ ] **Step 8: Add filtered empty state**

When `mediaAssets.length > 0` but `filteredLibraryItems.length === 0`, render:

```tsx
<Empty className="border">
  <EmptyHeader>
    <EmptyTitle>Nenhuma mídia encontrada</EmptyTitle>
    <EmptyDescription>
      Ajuste a busca ou o filtro de tipo para ver outros arquivos.
    </EmptyDescription>
  </EmptyHeader>
</Empty>
```

Keep the existing `Nenhuma mídia salva ainda` empty state for `mediaAssets.length === 0`.

## Task 9: Strengthen Project Delete Confirmation

**Files:**
- Modify: `apps/web/src/app/admin/components/DeleteProjectForm.tsx:1-71`

- [ ] **Step 1: Import `useState`, `Field`, `FieldLabel`, and `Input`**

At the top of `DeleteProjectForm.tsx`, keep `"use client";` and add:

```tsx
import { useState } from "react";
```

Add component imports:

```tsx
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
```

- [ ] **Step 2: Track confirmation text**

Inside `DeleteProjectForm`, before `return`, add:

```tsx
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation === projectTitle;
```

- [ ] **Step 3: Add the confirmation input in the dialog form**

Inside the `<form action={deleteProjectAction}>`, after the hidden project id input, add:

```tsx
<Field className="my-5">
  <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor="delete-project-confirmation">
    Digite o nome do projeto para confirmar
  </FieldLabel>
  <Input
    autoComplete="off"
    id="delete-project-confirmation"
    name="deleteProjectConfirmation"
    onChange={(event) => setConfirmation(event.target.value)}
    value={confirmation}
  />
</Field>
```

- [ ] **Step 4: Disable destructive submit until the project title matches**

Change:

```tsx
<AlertDialogAction type="submit" variant="destructive">
  Apagar projeto
</AlertDialogAction>
```

to:

```tsx
<AlertDialogAction disabled={!canDelete} type="submit" variant="destructive">
  Apagar projeto
</AlertDialogAction>
```

## Task 10: Full Verification

**Files:**
- Verify modified files only; do not create or run unit tests.

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint:web
```

Expected: exits with status 0. If it fails, fix only issues caused by this implementation.

- [ ] **Step 2: Run production build if lint passes**

Run:

```bash
npm run build:web
```

Expected: exits with status 0. If the build fails because of environment/network/backend availability, record the exact failure and do not claim the build passed.

- [ ] **Step 3: Manual browser checklist**

Start the dev server if needed:

```bash
npm run dev:web
```

Check:

- `/admin/login` renders and has a single `h1`.
- `/admin` renders with a single page `h1`.
- Sidebar includes `Mídias globais` and activates on `#midias`.
- Project search filters by title-like text.
- Project status filter switches between all, published, and draft.
- Media upload input is still usable.
- Media library search and image/video filter work.
- Image rows show thumbnails; video rows show a placeholder icon.
- Delete project dialog keeps submit disabled until the exact project title is typed.
- Keyboard tab order reaches sidebar, filters, tables, dialogs, and forms.
- Dark/light toggle updates the admin surface and native browser controls.

## Self-Review

- Spec coverage: accessibility/semantics are covered by Tasks 1, 2, 5, 6, 7, and 10; project filtering by Task 4; media filtering/preview by Task 8; destructive confirmation by Task 9; navigation by Task 3.
- Scope: no backend endpoints, database changes, route splits, drag-and-drop, realtime preview, or unit tests are included.
- Type consistency: `AdminProject` fields used in the plan exist in `admin-projects.ts`; `AdminMediaAsset` fields used in the plan exist in `admin-media.ts`.
- Implementation risk: `MediaUploadField` is the largest edit; keep helper functions local and avoid broad extraction unless lint/type errors force a small adjustment.
