import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  verifyAdminAccessToken,
} from "@/lib/api/admin-auth";

import { ProjectForm } from "../../components/ProjectForm";

export default async function NewProjectPage() {
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

  return (
    <>
      <section className="flex flex-col gap-6">
        <div>
          <p className="text-admin-label uppercase tracking-[0.18em] text-muted-foreground">Projetos</p>
          <h1 className="mt-2 font-display text-admin-page-title font-normal tracking-[-0.04em]">
            Criar novo projeto
          </h1>
          <p className="mt-2 max-w-2xl text-admin-body leading-6 text-muted-foreground">
            Primeiro crie a página do projeto. Depois você poderá enviar fotos, vídeos e montar os blocos.
          </p>
        </div>
        <ProjectForm mediaAssets={[]} />
      </section>
    </>
  );
}
