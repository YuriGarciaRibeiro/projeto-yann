# Admin Delete Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe admin control to permanently delete a project from its edit page.

**Architecture:** Add a focused database mutation, expose it through an authenticated server action, and render a small danger-zone form on the project edit page. The existing `project_sections.project_id` cascade removes blocks automatically; project media files remain in storage.

**Tech Stack:** Next.js App Router, Server Actions, Drizzle ORM, PostgreSQL, Tailwind CSS.

---

## Files

- Modify `src/lib/db/queries.ts`: add `deleteProject(projectId)` database mutation.
- Modify `src/app/admin/actions.ts`: add `deleteProjectAction(formData)` authenticated server action.
- Create `src/app/admin/components/DeleteProjectForm.tsx`: client confirmation form for deleting one project.
- Modify `src/app/admin/projetos/[id]/page.tsx`: render the danger-zone delete form.

## Task 1: Database Mutation

- [ ] Add `deleteProject` to `src/lib/db/queries.ts`.

```ts
export async function deleteProject(projectId: string) {
  const db = getDb();
  const [project] = await db.delete(projects).where(eq(projects.id, projectId)).returning();

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  return project;
}
```

- [ ] Verify TypeScript references resolve through `npm run build` after all tasks.

## Task 2: Server Action

- [ ] Import `deleteProject` in `src/app/admin/actions.ts`.
- [ ] Add `deleteProjectAction`.

```ts
export async function deleteProjectAction(formData: FormData) {
  await requireAdminSession();

  try {
    const projectId = getString(formData, "projectId");

    if (!projectId) {
      throw new Error("Projeto não encontrado.");
    }

    await deleteProject(projectId);
  } catch (error) {
    errorRedirect(error instanceof Error ? error.message : "Não foi possível apagar o projeto.");
  }

  revalidatePath(ADMIN_PATH);
  revalidatePath("/");
  statusRedirect("Projeto apagado.");
}
```

## Task 3: Delete Form Component

- [ ] Create `src/app/admin/components/DeleteProjectForm.tsx`.

```tsx
"use client";

import { deleteProjectAction } from "../actions";

export function DeleteProjectForm({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  return (
    <section className="border border-red-200 bg-white p-5 md:p-6">
      <h3 className="text-lg font-normal tracking-[-0.02em]">Zona de perigo</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
        Apagar este projeto remove a página e seus blocos. Os arquivos enviados não serão apagados do armazenamento agora.
      </p>
      <form action={deleteProjectAction} className="mt-5">
        <input name="projectId" type="hidden" value={projectId} />
        <button
          className="min-h-11 border border-red-700 px-5 text-sm uppercase tracking-[0.16em] text-red-700 hover:bg-red-700 hover:text-white focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-red-700"
          onClick={(event) => {
            if (!window.confirm(`Apagar definitivamente o projeto \"${projectTitle}\"?`)) {
              event.preventDefault();
            }
          }}
          type="submit"
        >
          Apagar projeto
        </button>
      </form>
    </section>
  );
}
```

## Task 4: Render On Edit Page

- [ ] Import and render `DeleteProjectForm` in `src/app/admin/projetos/[id]/page.tsx` after the block editor.

```tsx
import { DeleteProjectForm } from "../../components/DeleteProjectForm";

<DeleteProjectForm projectId={project.id} projectTitle={project.title} />
```

## Task 5: Verification

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `curl -I --max-time 10 http://localhost:3000/admin/projetos/novo` and expect redirect to `/admin/login` when unauthenticated.
- [ ] Run `curl -I --max-time 10 http://localhost:3000/admin` and expect redirect to `/admin/login` when unauthenticated.
