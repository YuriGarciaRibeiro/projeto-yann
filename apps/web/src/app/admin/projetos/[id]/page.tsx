import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  verifyAdminAccessToken,
} from "@/lib/api/admin-auth";
import { getAdminProjectMediaAssets } from "@/lib/api/admin-media";
import { getAdminProjectById, getAdminProjectSections } from "@/lib/api/admin-projects";

import { DeleteProjectForm } from "../../components/DeleteProjectForm";
import { MediaUploadField } from "../../components/MediaUploadField";
import { ProjectForm } from "../../components/ProjectForm";
import { ProjectSectionsEditor } from "../../components/ProjectSectionsEditor";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
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

  const { id } = await params;
  const project = await getAdminProjectById(id);

  if (!project) {
    notFound();
  }

  const [projectMediaAssets, sections] = await Promise.all([
    getAdminProjectMediaAssets(project.id),
    getAdminProjectSections(project.id),
  ]);

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/admin"
          >
            Voltar para projetos
          </Link>
          {project.slug ? (
            <Link
              className={buttonVariants()}
              href={`/projetos/${project.slug}`}
              rel="noreferrer"
              target="_blank"
            >
              Ver página do projeto
            </Link>
          ) : null}
        </div>

        <div>
          <p className="text-admin-label uppercase tracking-[0.18em] text-muted-foreground">Editar projeto</p>
          <h1 className="mt-2 font-display text-admin-page-title font-normal tracking-[-0.04em]">
            {project.title}
          </h1>
          <p className="mt-2 max-w-2xl text-admin-body leading-6 text-muted-foreground">
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
    </>
  );
}
