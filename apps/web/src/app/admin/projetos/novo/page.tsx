import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  verifyAdminAccessToken,
} from "@/lib/api/admin-auth";

import { AdminShell } from "../../components/AdminShell";
import { ProjectForm } from "../../components/ProjectForm";

type NewProjectPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

export default async function NewProjectPage({ searchParams }: NewProjectPageProps) {
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

  const params = await searchParams;

  return (
    <AdminShell error={params.error} status={params.status}>
      <section className="flex flex-col gap-6">
        <Link
          className="inline-flex min-h-11 items-center border border-border px-4 text-admin-label uppercase tracking-[0.16em] transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          href="/admin"
        >
          Voltar para projetos
        </Link>
        <div>
          <p className="text-admin-label uppercase tracking-[0.18em] text-muted-foreground">Projetos</p>
          <h2 className="mt-2 font-display text-admin-page-title font-normal tracking-[-0.04em]">
            Criar novo projeto
          </h2>
          <p className="mt-2 max-w-2xl text-admin-body leading-6 text-muted-foreground">
            Primeiro crie a página do projeto. Depois você poderá enviar fotos, vídeos e montar os blocos.
          </p>
        </div>
        <ProjectForm mediaAssets={[]} />
      </section>
    </AdminShell>
  );
}
