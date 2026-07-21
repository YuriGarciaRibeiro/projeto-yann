import type { PublishedProjectPageData } from "../ProjectPage";
import { MediaPlaceholder, ProjectImage, ProjectVideo } from "../ProjectMediaFallback";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];

type VideoBlockSectionProps = {
  sectionRow: ProjectSectionRow;
};

export function VideoBlockSection({ sectionRow }: VideoBlockSectionProps) {
  const { section, primaryMediaAsset, posterMediaAsset } = sectionRow;
  const videoAlt = primaryMediaAsset?.altText ?? section.title ?? section.caption ?? "Video do projeto";
  const posterAlt = posterMediaAsset?.altText ?? section.title ?? section.caption ?? "Video do projeto";

  return (
    <section
      aria-labelledby={section.title ? `${section.id}-title` : undefined}
      className="bg-[var(--black)] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-16"
      data-header-theme="light"
    >
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-12 lg:gap-4">
        <div className="lg:col-span-8 lg:col-start-3">
          <div className="aspect-video overflow-hidden bg-[var(--charcoal)]">
            {primaryMediaAsset ? (
              <ProjectVideo
                alt={videoAlt}
                className="h-full w-full object-cover"
                posterSrc={posterMediaAsset?.url ?? null}
                src={primaryMediaAsset.url}
                type={primaryMediaAsset.mimeType}
              />
            ) : posterMediaAsset ? (
              <PosterImage
                alt={posterAlt}
                src={posterMediaAsset.url}
              />
            ) : (
              <MediaPlaceholder
                className="h-full w-full"
                label={section.title ?? section.caption ?? "Video do projeto"}
                tone="dark"
              />
            )}
          </div>
          <SectionText id={section.id} title={section.title} body={section.body} caption={section.caption} />
        </div>
      </div>
    </section>
  );
}

function PosterImage({ alt, src }: { alt: string; src: string }) {
  return (
    <ProjectImage
      alt={alt}
      className="h-full w-full object-cover"
      placeholderClassName="h-full w-full"
      src={src}
      tone="dark"
    />
  );
}

function SectionText({
  body,
  caption,
  id,
  title,
}: {
  body: string | null;
  caption: string | null;
  id: string;
  title: string | null;
}) {
  if (!title && !body && !caption) {
    return null;
  }

  return (
    <div className="mt-6 grid gap-4 border-t border-white/18 pt-5 lg:grid-cols-8">
      {title ? (
        <h2
          className="font-[var(--font-display)] text-[var(--text-card-title)] font-normal tracking-[-0.035em] lg:col-span-3"
          id={`${id}-title`}
        >
          {title}
        </h2>
      ) : null}
      <div className="text-[var(--text-caption)] leading-6 text-white/68 lg:col-span-4 lg:col-start-5">
        {body ? <p className="whitespace-pre-line">{body}</p> : null}
        {caption ? <p className="mt-4 text-white/45">{caption}</p> : null}
      </div>
    </div>
  );
}
