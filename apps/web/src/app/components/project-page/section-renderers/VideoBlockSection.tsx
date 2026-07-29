import type { PublishedProjectPageData } from "../ProjectPage";
import { MediaPlaceholder, ProjectImage, ProjectVideo } from "../ProjectMediaFallback";
import { getYouTubeEmbedUrl } from "./youtubeEmbed";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];

type VideoBlockSectionProps = {
  sectionRow: ProjectSectionRow;
};

export function VideoBlockSection({ sectionRow }: VideoBlockSectionProps) {
  const { section, primaryMediaAsset, posterMediaAsset } = sectionRow;
  const videoAlt = primaryMediaAsset?.altText ?? section.title ?? section.caption ?? "Video do projeto";
  const posterAlt = posterMediaAsset?.altText ?? section.title ?? section.caption ?? "Video do projeto";
  const youtubeEmbedUrl = getYouTubeEmbedUrl(section.metadata?.youtubeUrl);

  return (
    <section
      aria-labelledby={section.title ? `${section.id}-title` : undefined}
      className="bg-black px-5 py-16 text-white sm:px-8 sm:py-28 lg:px-16"
      data-header-theme="light"
    >
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-12 lg:gap-4">
        <div className="lg:col-span-8 lg:col-start-3">
          <div className="aspect-video overflow-hidden bg-charcoal">
            {youtubeEmbedUrl ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                src={youtubeEmbedUrl}
                title={videoAlt}
              />
            ) : primaryMediaAsset ? (
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
                height={posterMediaAsset.height}
                src={posterMediaAsset.url}
                width={posterMediaAsset.width}
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

function PosterImage({ alt, height, src, width }: { alt: string; height: number | null; src: string; width: number | null }) {
  return (
    <ProjectImage
      alt={alt}
      className="h-full w-full object-cover"
      placeholderClassName="h-full w-full"
      height={height}
      sizes="100vw"
      src={src}
      tone="dark"
      width={width}
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
    <div className="mt-5 grid gap-4 border-t border-white/18 pt-5 sm:mt-6 lg:grid-cols-8">
      {title ? (
        <h2
          className="font-display text-card-title font-normal tracking-[-0.035em] lg:col-span-3"
          id={`${id}-title`}
        >
          {title}
        </h2>
      ) : null}
      <div className="max-w-[34rem] text-caption leading-6 text-white/70 lg:col-span-4 lg:col-start-5">
        {body ? <p className="whitespace-pre-line">{body}</p> : null}
        {caption ? <p className="mt-4 text-white/62">{caption}</p> : null}
      </div>
    </div>
  );
}
