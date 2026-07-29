import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <section className="flex flex-col gap-6" id="projects">
        <div>
          <p className="text-admin-label uppercase tracking-[0.18em] text-muted-foreground" id="projetos">
            Projetos
          </p>
          <h2 className="mt-2 font-display text-admin-page-title font-normal tracking-[-0.04em]">
            Páginas de projeto
          </h2>
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
    </AdminShell>
  );
}

function ProjectList({ projects }: { projects: AdminProject[] }) {
  return (
    <Card className="rounded-none">
      <CardHeader className="gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-2">
          <CardTitle className="text-admin-section-title font-normal tracking-[-0.02em]">Lista de projetos</CardTitle>
          <CardDescription className="max-w-2xl text-admin-body leading-6">
            Entre em um projeto para editar seus dados, arquivos e blocos da página.
          </CardDescription>
        </div>
        <CardAction className="col-auto row-auto justify-self-start md:justify-self-end">
          <Link
            className={buttonVariants({
              className: "min-h-11 rounded-none px-5 text-admin-label uppercase tracking-[0.16em]",
            })}
            href="/admin/projetos/novo"
          >
            Criar novo projeto
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent>
        {projects.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="min-w-56 whitespace-normal font-display text-admin-card-title font-normal tracking-[-0.04em]">
                    {project.title}
                  </TableCell>
                  <TableCell>{project.year}</TableCell>
                  <TableCell>
                    <Badge variant={project.isPublished ? "default" : "secondary"}>
                      {project.isPublished ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                      <Link
                        className={buttonVariants({
                          className: "min-h-10 rounded-none text-admin-label uppercase tracking-[0.16em]",
                        })}
                        href={`/admin/projetos/${project.id}`}
                      >
                        Editar
                      </Link>
                      {project.isPublished ? (
                        <Link
                          className={buttonVariants({
                            className: "min-h-10 rounded-none text-admin-label uppercase tracking-[0.16em]",
                            variant: "outline",
                          })}
                          href={`/projetos/${project.slug}`}
                          target="_blank"
                        >
                          Ver página
                        </Link>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Nenhum projeto criado ainda</EmptyTitle>
              <EmptyDescription>
                Crie o primeiro projeto para começar a montar uma página pública com fotos, vídeos e blocos.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link
                className={buttonVariants({
                  className: "rounded-none text-admin-label uppercase tracking-[0.16em]",
                })}
                href="/admin/projetos/novo"
              >
                Criar projeto
              </Link>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
