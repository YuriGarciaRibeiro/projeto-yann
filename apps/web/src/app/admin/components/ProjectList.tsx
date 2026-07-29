"use client";

import Link from "next/link";
import { useState } from "react";

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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminProject } from "@/lib/api/admin-projects";

type ProjectStatusFilter = "all" | "published" | "draft";

const statusOptions = [
  { label: "Todos", value: "all" },
  { label: "Publicados", value: "published" },
  { label: "Rascunhos", value: "draft" },
] satisfies Array<{ label: string; value: ProjectStatusFilter }>;

function getProjectSearchText(project: AdminProject) {
  return [
    project.title,
    project.slug,
    project.location,
    project.category,
    project.year,
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLocaleLowerCase("pt-BR");
}

function matchesProjectStatus(project: AdminProject, status: ProjectStatusFilter) {
  if (status === "published") {
    return project.isPublished;
  }

  if (status === "draft") {
    return !project.isPublished;
  }

  return true;
}

export function ProjectList({ projects }: { projects: AdminProject[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProjectStatusFilter>("all");
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const filteredProjects = projects.filter((project) => {
    const matchesQuery = normalizedQuery
      ? getProjectSearchText(project).includes(normalizedQuery)
      : true;

    return matchesQuery && matchesProjectStatus(project, status);
  });

  return (
    <Card>
      <CardHeader className="gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-2">
          <CardTitle className="text-admin-section-title font-normal tracking-[-0.02em]">Lista de projetos</CardTitle>
          <CardDescription className="max-w-2xl text-admin-body leading-6">
            Entre em um projeto para editar seus dados, arquivos e blocos da página.
          </CardDescription>
        </div>
        <CardAction className="col-auto row-auto justify-self-start md:justify-self-end">
          <Link className={buttonVariants()} href="/admin/projetos/novo">
            Criar novo projeto
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {projects.length > 0 ? (
          <>
            <FieldGroup className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
              <Field>
                <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor="project-search">
                  Buscar projetos
                </FieldLabel>
                <Input
                  autoComplete="off"
                  id="project-search"
                  name="projectSearch"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Casa branca…"
                  type="search"
                  value={query}
                />
              </Field>
              <Field>
                <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor="project-status-filter">
                  Status
                </FieldLabel>
                <Select
                  items={statusOptions}
                  name="projectStatusFilter"
                  onValueChange={(value) => setStatus(value as ProjectStatusFilter)}
                  value={status}
                >
                  <SelectTrigger className="w-full" id="project-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            {filteredProjects.length > 0 ? (
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
                  {filteredProjects.map((project) => (
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
                          <Link className={buttonVariants()} href={`/admin/projetos/${project.id}`}>
                            Editar
                          </Link>
                          {project.isPublished ? (
                            <Link
                              className={buttonVariants({ variant: "outline" })}
                              href={`/projetos/${project.slug}`}
                              rel="noreferrer"
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
                  <EmptyTitle>Nenhum projeto encontrado</EmptyTitle>
                  <EmptyDescription>
                    Ajuste a busca ou o filtro de status para ver outros projetos.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Nenhum projeto criado ainda</EmptyTitle>
              <EmptyDescription>
                Crie o primeiro projeto para começar a montar uma página pública com fotos, vídeos e blocos.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link className={buttonVariants()} href="/admin/projetos/novo">
                Criar projeto
              </Link>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
