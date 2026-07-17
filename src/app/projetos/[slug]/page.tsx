import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectPage } from "@/app/components/project-page/ProjectPage";
import { getPublishedProjectBySlugWithMedia } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

type ProjectRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProjectRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlugWithMedia(slug);

  if (!project) {
    return {
      title: "Projeto nao encontrado | Yann",
    };
  }

  return {
    title: `${project.project.title} | Yann`,
    description: project.project.shortDescription,
  };
}

export default async function PublicProjectRoute({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlugWithMedia(slug);

  if (!project) {
    notFound();
  }

  return <ProjectPage data={project} />;
}
