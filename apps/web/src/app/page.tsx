import { redirect } from "next/navigation";

import { getFeaturedProject } from "@/lib/api/public-projects";

export const dynamic = "force-dynamic";

export default async function Home() {
  let firstProject: Awaited<ReturnType<typeof getFeaturedProject>> | null = null;

  try {
    firstProject = await getFeaturedProject();
  } catch (error) {
    console.error("Unable to load published project for root route:", error);
  }

  if (firstProject) {
    redirect(`/projetos/${firstProject.slug}`);
  }

  return (
    <main className="min-h-svh bg-[var(--paper)] px-6 py-6 text-[var(--ink)] sm:px-10 sm:py-8">
      <div className="flex min-h-[calc(100svh-3rem)] flex-col justify-between border border-[var(--line)] p-5 sm:min-h-[calc(100svh-4rem)] sm:p-8">
        <header className="flex items-start justify-between gap-8 text-[var(--text-label)] uppercase tracking-[0.28em] text-[var(--mid-gray)]">
          <p>Projetos</p>
          <p>Administração privada</p>
        </header>

        <section className="max-w-3xl py-24 sm:py-32">
          <p className="mb-6 text-[var(--text-label)] uppercase tracking-[0.28em] text-[var(--mid-gray)]">
            Nenhum projeto publicado
          </p>
          <h1 className="font-[var(--font-display)] text-[var(--text-page-title)] font-normal leading-[0.86] tracking-[-0.08em]">
            Projetos
          </h1>
          <p className="mt-8 max-w-xl text-[var(--text-body)] leading-relaxed text-[var(--graphite)]">
            Publique uma página de projeto no admin para abrir automaticamente a primeira página pública disponível.
          </p>
        </section>

        <footer className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 text-[var(--text-label)] uppercase tracking-[0.22em] text-[var(--mid-gray)] sm:flex-row sm:items-center sm:justify-between">
          <p>Páginas públicas de projeto</p>
          <p>/admin</p>
        </footer>
      </div>
    </main>
  );
}
