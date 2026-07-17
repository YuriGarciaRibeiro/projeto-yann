import { redirect } from "next/navigation";

import { getFirstPublishedProjectForRoot } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  let firstProject: Awaited<ReturnType<typeof getFirstPublishedProjectForRoot>> | null = null;

  try {
    firstProject = await getFirstPublishedProjectForRoot();
  } catch (error) {
    console.error("Unable to load published project for root route:", error);
  }

  if (firstProject) {
    redirect(`/projetos/${firstProject.slug}`);
  }

  return (
    <main className="min-h-svh bg-[var(--paper)] px-6 py-6 text-[var(--ink)] sm:px-10 sm:py-8">
      <div className="flex min-h-[calc(100svh-3rem)] flex-col justify-between border border-[var(--line)] p-5 sm:min-h-[calc(100svh-4rem)] sm:p-8">
        <header className="flex items-start justify-between gap-8 text-[0.6875rem] uppercase tracking-[0.28em] text-[var(--mid-gray)]">
          <p>Projetos</p>
          <p>Administração privada</p>
        </header>

        <section className="max-w-3xl py-24 sm:py-32">
          <p className="mb-6 text-[0.6875rem] uppercase tracking-[0.28em] text-[var(--mid-gray)]">
            Nenhum projeto publicado
          </p>
          <h1 className="font-serif text-[clamp(3.5rem,12vw,10rem)] font-normal leading-[0.86] tracking-[-0.08em]">
            Projetos
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-[var(--graphite)] sm:text-lg">
            Publique uma página de projeto no admin para abrir automaticamente a primeira página pública disponível.
          </p>
        </section>

        <footer className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 text-[0.6875rem] uppercase tracking-[0.22em] text-[var(--mid-gray)] sm:flex-row sm:items-center sm:justify-between">
          <p>Páginas públicas de projeto</p>
          <p>/admin</p>
        </footer>
      </div>
    </main>
  );
}
