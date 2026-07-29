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
      className="bg-paper px-5 py-14 text-ink sm:px-8 sm:py-24 lg:px-16"
      data-header-theme="dark"
    >
      <div className="mx-auto max-w-[1440px]">
        {primaryMediaAsset ? (
          <ProjectImage
            alt={imageAlt}
            className="min-h-[42svh] w-full object-cover sm:min-h-[55svh]"
            placeholderClassName="min-h-[42svh] w-full sm:min-h-[55svh]"
            height={primaryMediaAsset.height}
            sizes="100vw"
            src={primaryMediaAsset.url}
            width={primaryMediaAsset.width}
          />
        ) : (
          <MediaPlaceholder
            className="min-h-[42svh] w-full sm:min-h-[55svh]"
            label={section.title ?? section.caption ?? "Imagem do projeto"}
          />
        )}
        <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:mt-6 lg:grid-cols-12">
          {section.title ? (
            <h2
              className="font-display text-card-title font-normal tracking-[-0.035em] lg:col-span-4"
              id={`${section.id}-title`}
            >
              {section.title}
            </h2>
          ) : null}
          <div className="text-caption leading-6 text-graphite lg:col-span-4 lg:col-start-8">
            {section.body ? <p className="whitespace-pre-line">{section.body}</p> : null}
            {section.caption ? <p className="mt-4 text-mid-gray">{section.caption}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
