"use client";

import { deleteProjectAction } from "../actions";

type DeleteProjectFormProps = {
  projectId: string;
  projectTitle: string;
};

export function DeleteProjectForm({ projectId, projectTitle }: DeleteProjectFormProps) {
  return (
    <section className="border border-red-200 bg-white p-5 md:p-6">
      <h3 className="text-[var(--text-admin-section-title)] font-normal tracking-[-0.02em]">Zona de perigo</h3>
      <p className="mt-2 max-w-2xl text-[var(--text-admin-body)] leading-6 text-neutral-600">
        Apagar este projeto remove a página e seus blocos. Os arquivos enviados não serão apagados do armazenamento agora.
      </p>
      <form action={deleteProjectAction} className="mt-5">
        <input name="projectId" type="hidden" value={projectId} />
        <button
          className="min-h-11 border border-red-700 px-5 text-[var(--text-admin-label)] uppercase tracking-[0.16em] text-red-700 hover:bg-red-700 hover:text-white focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-red-700"
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
