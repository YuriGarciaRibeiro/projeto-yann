import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  verifyAdminAccessToken,
} from "@/lib/api/admin-auth";
import { getAdminSiteMediaAssets } from "@/lib/api/admin-media";
import { getAdminProjects, type AdminProject } from "@/lib/api/admin-projects";

import { AdminShell } from "./components/AdminShell";
import { MediaUploadField } from "./components/MediaUploadField";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const cookieStore = await cookies();
  let admin: Awaited<ReturnType<typeof verifyAdminAccessToken>> = null;

  try {
    admin = await verifyAdminAccessToken(
      cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value,
    );
  } catch {
    admin = null;
  }

  if (!admin) {
    redirect("/admin/login");
  }

  const [params, projects, siteMediaAssets] = await Promise.all([
    searchParams,
    getAdminProjects(),
    getAdminSiteMediaAssets(),
  ]);

  return (
    <AdminShell error={params.error} status={params.status}>
      <section className="space-y-6" id="projects">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-neutral-500" id="projetos">
            Projetos
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-4xl font-normal tracking-[-0.04em]">
            Páginas de projeto
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Crie, edite e organize as páginas públicas dos projetos. As fotos e vídeos enviados aparecem nos campos de mídia.
          </p>
        </div>
        <ProjectList projects={projects} />
      </section>
      <MediaUploadField
        description="Envie arquivos globais usados fora de um projeto específico. Arquivos de projeto devem ser enviados dentro da tela do projeto."
        mediaAssets={siteMediaAssets}
        title="Arquivos globais"
        usageScope="site"
      />
    </AdminShell>
  );
}

function ProjectList({ projects }: { projects: AdminProject[] }) {
  return (
    <section className="border border-neutral-200 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-normal tracking-[-0.02em]">Lista de projetos</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Entre em um projeto para editar seus dados, arquivos e blocos da página.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center border border-neutral-950 px-5 text-sm uppercase tracking-[0.16em] hover:bg-neutral-950 hover:text-white focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
          href="/admin/projetos/novo"
        >
          Criar novo projeto
        </Link>
      </div>

      {projects.length > 0 ? (
        <ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
          {projects.map((project) => (
            <li className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center" key={project.id}>
              <div>
                <p className="font-[var(--font-display)] text-3xl font-normal tracking-[-0.04em]">
                  {project.title}
                </p>
                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600">
                  <div>
                    <dt className="sr-only">Ano</dt>
                    <dd>{project.year}</dd>
                  </div>
                  <div>
                    <dt className="sr-only">Status</dt>
                    <dd>{project.isPublished ? "Publicado" : "Rascunho"}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="inline-flex min-h-11 items-center border border-neutral-950 px-4 text-sm uppercase tracking-[0.16em] hover:bg-neutral-950 hover:text-white focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
                  href={`/admin/projetos/${project.id}`}
                >
                  Editar
                </Link>
                {project.isPublished ? (
                  <Link
                    className="inline-flex min-h-11 items-center border border-neutral-300 px-4 text-sm uppercase tracking-[0.16em] hover:border-neutral-950 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
                    href={`/projetos/${project.slug}`}
                    target="_blank"
                  >
                    Ver página
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 border border-neutral-200 px-4 py-3 text-sm text-neutral-600">
          Nenhum projeto criado ainda.
        </p>
      )}
    </section>
  );
}
