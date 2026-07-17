import type { Project } from "@/lib/db/schema";

import type { PublishedProjectPageData } from "../ProjectPage";
import { ProjectContactCreditFooter } from "./ProjectContactCreditFooter";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];
type ContactMediaAsset = ProjectSectionRow["primaryMediaAsset"];

type ContactCreditSectionProps = {
  project: Project;
  sectionRow: ProjectSectionRow;
};

export function ContactCreditSection({ project, sectionRow }: ContactCreditSectionProps) {
  const { section } = sectionRow;

  return (
    <ProjectContactCreditFooter
      body={section.body}
      mediaAsset={toContactMediaAsset(sectionRow.primaryMediaAsset)}
      project={toContactProject(project)}
      title={section.title}
      titleId={`${section.id}-title`}
    />
  );
}

export function toContactProject(project: Project) {
  return {
    clientArchitectEmail: project.clientArchitectEmail,
    clientArchitectInstagram: project.clientArchitectInstagram,
    clientArchitectName: project.clientArchitectName,
    clientArchitectPhone: project.clientArchitectPhone,
    clientArchitectWebsite: project.clientArchitectWebsite,
    title: project.title,
  };
}

export function toContactMediaAsset(mediaAsset: ContactMediaAsset) {
  return mediaAsset ? { altText: mediaAsset.altText, url: mediaAsset.url } : null;
}
