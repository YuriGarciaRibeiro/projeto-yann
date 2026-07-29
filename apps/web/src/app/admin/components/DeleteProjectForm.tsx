"use client";

import { deleteProjectAction } from "../actions";

type DeleteProjectFormProps = {
  projectId: string;
  projectTitle: string;
};

export function DeleteProjectForm({ projectId, projectTitle }: DeleteProjectFormProps) {
  return (
    <section className="border border-destructive bg-card p-5 text-card-foreground md:p-6">
      <h3 className="text-admin-section-title font-normal tracking-[-0.02em]">Zona de perigo</h3>
      <p className="mt-2 max-w-2xl text-admin-body leading-6 text-muted-foreground">
        Apagar este projeto remove a página e seus blocos. Os arquivos enviados não serão apagados do armazenamento agora.
      </p>
      <form action={deleteProjectAction} className="mt-5">
        <input name="projectId" type="hidden" value={projectId} />
        <button
          className="min-h-11 border border-destructive px-5 text-admin-label uppercase tracking-[0.16em] text-destructive transition-colors hover:bg-destructive hover:text-primary-foreground focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-ring"
          onClick={(event) => {
            if (!window.confirm(`Apagar definitivamente o projeto "${projectTitle}"?`)) {
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
