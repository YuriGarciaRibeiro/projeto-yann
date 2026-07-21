import type { PublishedProjectPageData } from "@/lib/api/public-projects";
import type { ProjectPreloadMedia } from "./ProjectPreloader";

export type { PublishedProjectPageData };

import { ProjectHero } from "./ProjectHero";
import { ProjectPreloader } from "./ProjectPreloader";
import { ProjectSectionRenderer } from "./ProjectSectionRenderer";
import { groupProjectSections } from "./groupProjectSections";
import { toContactMediaAsset, toContactProject } from "./section-renderers/ContactCreditSection";
import { ParallaxVideoSequence } from "./section-renderers/ParallaxVideoSequence";
import { ProjectContactCreditFooter } from "./section-renderers/ProjectContactCreditFooter";

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
  const renderGroups = groupProjectSections(renderedSections);
  const preloadMedia: ProjectPreloadMedia[] = [];
  const preloadMediaSources = new Set<string>();
  const addPreloadMedia = (src: string | null | undefined, mimeType: string | null | undefined) => {
    if (!src || !mimeType?.startsWith("video/") || preloadMediaSources.has(src)) {
      return;
    }

    preloadMediaSources.add(src);
    preloadMedia.push({ mimeType, src });
  };

  addPreloadMedia(data.heroVideoAsset?.url, data.heroVideoAsset?.mimeType);
  renderedSections.forEach((sectionRow) => {
    if (sectionRow.section.type === "parallax_video") {
      addPreloadMedia(sectionRow.primaryMediaAsset?.url, sectionRow.primaryMediaAsset?.mimeType);
    }
  });

  return (
    <ProjectPreloader
      posterSrc={data.fallbackImageAsset?.url ?? null}
      preloadMedia={preloadMedia}
      projectTitle={data.project.title}
      videoMimeType={data.heroVideoAsset?.mimeType ?? null}
      videoSrc={data.heroVideoAsset?.url ?? null}
    >
      <main className="overflow-x-clip bg-[var(--paper)] text-[var(--ink)]">
        <ProjectHero data={data} sectionCount={renderedSections.length} />
        <article aria-label={`Conteudo do projeto ${data.project.title}`}>
          {renderGroups.map((group) =>
            group.type === "parallax_sequence" ? (
              <ParallaxVideoSequence key={group.key} sectionRows={group.sections} />
            ) : (
              <ProjectSectionRenderer
                key={group.key}
                overlapPrevious={false}
                project={data.project}
                sectionRow={group.section}
              />
            ),
          )}
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
