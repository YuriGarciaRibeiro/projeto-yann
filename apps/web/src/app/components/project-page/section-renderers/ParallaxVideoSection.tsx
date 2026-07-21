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
        <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(90deg,rgb(0_0_0/0.58)_0%,rgb(0_0_0/0.22)_40%,transparent_72%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2 bg-[linear-gradient(0deg,rgb(0_0_0/0.56)_0%,transparent_68%)]" />

        <div className="relative z-30 mx-auto grid min-h-svh max-w-[1440px] grid-cols-4 content-end gap-4 px-5 pb-10 pt-28 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-16 lg:pb-16">
          <div className="col-span-4 sm:col-span-5 lg:col-span-6">
            {section.title ? (
              <h2
                className="font-display text-project-title font-normal leading-[0.95] tracking-[-0.045em]"
                id={`${section.id}-title`}
              >
                {section.title}
              </h2>
            ) : null}
            {section.body ? (
              <p className="mt-6 max-w-2xl whitespace-pre-line text-body-large leading-[1.55] text-white/76">
                {section.body}
              </p>
            ) : null}
          </div>
          {section.caption ? (
            <p className="col-span-4 mt-10 self-end border border-white/10 bg-white/[0.08] px-4 py-3 text-caption leading-6 text-white/72 sm:col-span-3 lg:col-span-3 lg:col-start-10 lg:mt-0">
              {section.caption}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
