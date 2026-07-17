import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  verifySessionCookieValue,
} from "@/lib/auth/session";
import {
  getAdminProjectById,
  getAdminProjectMediaAssets,
  getAdminProjectSections,
} from "@/lib/db/queries";

import { AdminShell } from "../../components/AdminShell";
import { DeleteProjectForm } from "../../components/DeleteProjectForm";
import { MediaUploadField } from "../../components/MediaUploadField";
import { ProjectForm } from "../../components/ProjectForm";
import { ProjectSectionsEditor } from "../../components/ProjectSectionsEditor";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

export default async function EditProjectPage({
  params,
  searchParams,
}: EditProjectPageProps) {
  const cookieStore = await cookies();
  const session = await verifySessionCookieValue(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (!session) {
    redirect("/admin/login");
  }

  const [{ id }, pageParams] = await Promise.all([params, searchParams]);
  const project = await getAdminProjectById(id);

  if (!project) {
    notFound();
  }

  const [projectMediaAssets, sections] = await Promise.all([
    getAdminProjectMediaAssets(project.id),
    getAdminProjectSections(project.id),
  ]);

  return (
    <AdminShell error={pageParams.error} status={pageParams.status}>
      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link
            className="inline-flex min-h-11 items-center justify-center border border-neutral-300 px-4 text-sm uppercase tracking-[0.16em] hover:border-neutral-950 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
            href="/admin"
          >
            Voltar para projetos
          </Link>
          {project.slug ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center border border-neutral-950 px-4 text-sm uppercase tracking-[0.16em] hover:bg-neutral-950 hover:text-white focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
              href={`/projetos/${project.slug}`}
              target="_blank"
            >
              Ver página do projeto
            </Link>
          ) : null}
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-neutral-500">Editar projeto</p>
          <h2 className="mt-2 font-[var(--font-display)] text-4xl font-normal tracking-[-0.04em]">
            {project.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Edite os dados, arquivos e blocos desta página. Nenhum outro projeto aparece aqui.
          </p>
        </div>

        <ProjectForm mediaAssets={projectMediaAssets} project={project} />
        <MediaUploadField
          description="Envie fotos e vídeos que pertencem somente a este projeto. Eles aparecem apenas nos campos desta página."
          mediaAssets={projectMediaAssets}
          projectId={project.id}
          title={`Arquivos de ${project.title}`}
          usageScope="project"
        />
        <ProjectSectionsEditor
          mediaAssets={projectMediaAssets}
          project={project}
          sections={sections}
        />
        <DeleteProjectForm projectId={project.id} projectTitle={project.title} />
      </section>
    </AdminShell>
  );
}
