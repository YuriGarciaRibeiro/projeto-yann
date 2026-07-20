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
      <section className="space-y-6">
        <Link
          className="inline-flex min-h-11 items-center border border-neutral-300 px-4 text-sm uppercase tracking-[0.16em] hover:border-neutral-950 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-neutral-950"
          href="/admin"
        >
          Voltar para projetos
        </Link>
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-neutral-500">Projetos</p>
          <h2 className="mt-2 font-[var(--font-display)] text-4xl font-normal tracking-[-0.04em]">
            Criar novo projeto
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Primeiro crie a página do projeto. Depois você poderá enviar fotos, vídeos e montar os blocos.
          </p>
        </div>
        <ProjectForm mediaAssets={[]} />
      </section>
    </AdminShell>
  );
}
