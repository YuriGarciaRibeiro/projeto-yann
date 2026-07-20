import type { PublishedProjectPageData } from "../ProjectPage";
import { MediaPlaceholder, ProjectImage } from "../ProjectMediaFallback";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];

type ImageBlockSectionProps = {
  sectionRow: ProjectSectionRow;
};

export function ImageBlockSection({ sectionRow }: ImageBlockSectionProps) {
  const { section, primaryMediaAsset } = sectionRow;
  const imageAlt = primaryMediaAsset?.altText ?? section.title ?? section.caption ?? "Imagem do projeto";

  return (
    <section
      aria-labelledby={section.title ? `${section.id}-title` : undefined}
      className="bg-[var(--paper)] px-5 py-16 text-[var(--ink)] sm:px-8 sm:py-24 lg:px-16"
      data-header-theme="dark"
    >
      <div className="mx-auto max-w-[1440px]">
        {primaryMediaAsset ? (
          <ProjectImage
            alt={imageAlt}
            className="min-h-[55svh] w-full object-cover"
            placeholderClassName="min-h-[55svh] w-full"
            src={primaryMediaAsset.url}
          />
        ) : (
          <MediaPlaceholder
            className="min-h-[55svh] w-full"
            label={section.title ?? section.caption ?? "Imagem do projeto"}
          />
        )}
        <div className="mt-6 grid gap-4 border-t border-[var(--line)] pt-5 lg:grid-cols-12">
          {section.title ? (
            <h2
              className="font-[var(--font-display)] text-[var(--text-h3)] font-normal tracking-[-0.035em] lg:col-span-4"
              id={`${section.id}-title`}
            >
              {section.title}
            </h2>
          ) : null}
          <div className="text-sm leading-6 text-[var(--graphite)] lg:col-span-4 lg:col-start-8">
            {section.body ? <p className="whitespace-pre-line">{section.body}</p> : null}
            {section.caption ? <p className="mt-4 text-[var(--mid-gray)]">{section.caption}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
