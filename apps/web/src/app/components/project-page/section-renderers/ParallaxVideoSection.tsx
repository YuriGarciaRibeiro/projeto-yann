import { ProjectScrollMedia } from "../../ProjectScrollMedia";
import type { PublishedProjectPageData } from "../ProjectPage";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];

type ParallaxVideoSectionProps = {
  overlapPrevious?: boolean;
  sectionRow: ProjectSectionRow;
};

export function ParallaxVideoSection({
  overlapPrevious = false,
  sectionRow,
}: ParallaxVideoSectionProps) {
  const { section, primaryMediaAsset, posterMediaAsset } = sectionRow;
  const mediaAlt =
    posterMediaAsset?.altText ?? primaryMediaAsset?.altText ?? section.title ?? "Video do projeto.";

  return (
    <section
      aria-labelledby={section.title ? `${section.id}-title` : undefined}
      className={`project-scroll-range project-scrub-flow relative bg-black text-white ${
        overlapPrevious ? "project-parallax-overlap" : ""
      }`}
      data-header-theme="light"
    >
      <div className="project-scroll-stage sticky top-0 min-h-svh overflow-hidden">
        <ProjectScrollMedia
          alt={mediaAlt}
          posterSrc={posterMediaAsset?.url ?? null}
          scrollRangeClassName="project-scroll-range"
          title={section.title ?? "Projeto"}
          videoMimeType={primaryMediaAsset?.mimeType ?? null}
          videoSrc={primaryMediaAsset?.url ?? null}
        />

        <div className="relative z-30 grid min-h-svh max-w-none grid-cols-4 content-end gap-4 px-5 pb-8 pt-24 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-8 lg:pb-16 xl:px-10">
          <div className="col-span-4 [text-shadow:0_2px_18px_rgb(0_0_0/0.55)] sm:col-span-5 lg:col-span-6">
            {section.title ? (
              <h2
                className="max-w-[92vw] font-display text-project-title font-normal leading-[0.92] tracking-[-0.05em] [text-wrap:balance] lg:leading-[0.95] lg:tracking-[-0.045em]"
                id={`${section.id}-title`}
              >
                {section.title}
              </h2>
            ) : null}
            {section.body ? (
              <p className="mt-5 max-w-[34rem] whitespace-pre-line text-body-large leading-[1.62] text-white/78 sm:mt-6">
                {section.body}
              </p>
            ) : null}
          </div>
          {section.caption ? (
            <p className="col-span-4 mt-8 max-w-[34rem] self-end border border-white/10 bg-white/[0.045] px-4 py-3 text-caption leading-6 text-white/74 sm:col-span-3 lg:col-span-3 lg:col-start-10 lg:mt-0 xl:col-start-10">
              {section.caption}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
