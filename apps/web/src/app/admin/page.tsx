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

export default async function AdminPage() {
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

  const [projects, siteMediaAssets] = await Promise.all([
    getAdminProjects(),
    getAdminSiteMediaAssets(),
  ]);

  return (
    <>
      <section className="flex flex-col gap-6" id="projects">
        <div>
          <p className="text-admin-label uppercase tracking-[0.18em] text-muted-foreground" id="projetos">
            Projetos
          </p>
          <h1 className="mt-2 font-display text-admin-page-title font-normal tracking-[-0.04em]">
            Páginas de projeto
          </h1>
          <p className="mt-2 max-w-2xl text-admin-body leading-6 text-muted-foreground">
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
    </>
  );
}
