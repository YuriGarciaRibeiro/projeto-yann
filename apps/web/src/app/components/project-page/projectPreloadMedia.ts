import type { PublishedProjectPageData } from "@/lib/api/public-projects";

import type { ProjectPreloadMedia } from "./ProjectPreloader";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];

type BuildProjectPreloadMediaInput = {
  heroVideoAsset: PublishedProjectPageData["heroVideoAsset"];
  renderedSections: ProjectSectionRow[];
};

export function buildProjectPreloadMedia({
  heroVideoAsset,
  renderedSections,
}: BuildProjectPreloadMediaInput): ProjectPreloadMedia[] {
  const preloadMedia: ProjectPreloadMedia[] = [];
  const seenSources = new Set<string>();

  const addMedia = (src: string | null | undefined, mimeType: string | null | undefined) => {
    if (!src || !mimeType?.startsWith("video/") || seenSources.has(src)) {
      return false;
    }

    seenSources.add(src);
    preloadMedia.push({ mimeType, src });
    return preloadMedia.length >= 2;
  };

  if (addMedia(heroVideoAsset?.url, heroVideoAsset?.mimeType)) {
    return preloadMedia;
  }

  for (const sectionRow of renderedSections) {
    if (sectionRow.section.type === "parallax_video" || sectionRow.section.type === "video_block") {
      if (addMedia(sectionRow.primaryMediaAsset?.url, sectionRow.primaryMediaAsset?.mimeType)) {
        break;
      }
    }

    for (const itemRow of sectionRow.parallaxGroupItems) {
      if (addMedia(itemRow.primaryMediaAsset?.url, itemRow.primaryMediaAsset?.mimeType)) {
        return preloadMedia;
      }
    }
  }

  return preloadMedia;
}
