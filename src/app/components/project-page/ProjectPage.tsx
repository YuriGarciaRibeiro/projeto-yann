import type { getPublishedProjectBySlugWithMedia } from "@/lib/db/queries";

import { ProjectHero } from "./ProjectHero";
import { ProjectPreloader } from "./ProjectPreloader";
import { ProjectSectionRenderer } from "./ProjectSectionRenderer";
import { toContactMediaAsset, toContactProject } from "./section-renderers/ContactCreditSection";
import { ProjectContactCreditFooter } from "./section-renderers/ProjectContactCreditFooter";

export type PublishedProjectPageData = NonNullable<
  Awaited<ReturnType<typeof getPublishedProjectBySlugWithMedia>>
>;

type ProjectPageProps = {
  data: PublishedProjectPageData;
};

export function ProjectPage({ data }: ProjectPageProps) {
  const renderedSections = data.sections.filter(
    (sectionRow) =>
      sectionRow.section.type !== "contact_credit" &&
      !(
        sectionRow.section.type === "parallax_video" &&
        data.heroVideoAsset?.id &&
        sectionRow.primaryMediaAsset?.id === data.heroVideoAsset.id
      ),
  );

  return (
    <ProjectPreloader
      posterSrc={data.fallbackImageAsset?.url ?? null}
      projectTitle={data.project.title}
      videoMimeType={data.heroVideoAsset?.mimeType ?? null}
      videoSrc={data.heroVideoAsset?.url ?? null}
    >
      <main className="overflow-x-clip bg-[var(--paper)] text-[var(--ink)]">
        <ProjectHero data={data} sectionCount={renderedSections.length} />
        <article aria-label={`Conteudo do projeto ${data.project.title}`}>
          {renderedSections.map((sectionRow, index) => {
            const previousSection = renderedSections[index - 1];
            const shouldOverlapPrevious =
              sectionRow.section.type === "parallax_video" &&
              previousSection?.section.type === "parallax_video";

            return (
              <ProjectSectionRenderer
                key={sectionRow.section.id}
                overlapPrevious={shouldOverlapPrevious}
                project={data.project}
                sectionRow={sectionRow}
              />
            );
          })}
          <ProjectContactCreditFooter
            mediaAsset={toContactMediaAsset(data.clientArchitectImageAsset)}
            project={toContactProject(data.project)}
            title={data.project.clientArchitectName}
            titleId="project-contact-credit-footer-title"
          />
        </article>
      </main>
    </ProjectPreloader>
  );
}
