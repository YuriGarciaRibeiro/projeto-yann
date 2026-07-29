import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildProjectPreloadMedia } from "./projectPreloadMedia";
import type { PublishedProjectPageData } from "./ProjectPage";

type SectionRow = PublishedProjectPageData["sections"][number];

function sectionRow(id: string, type: SectionRow["section"]["type"], url: string): SectionRow {
  return {
    primaryMediaAsset: {
      altText: null,
      createdAt: "2026-07-28T00:00:00.000Z",
      durationSeconds: null,
      height: null,
      id: `${id}-media`,
      mimeType: "video/mp4",
      projectId: null,
      sizeBytes: 1,
      storageKey: `${id}.mp4`,
      usageScope: "project",
      url,
      videoVariant: null,
      width: null,
    },
    posterMediaAsset: null,
    section: {
      body: null,
      caption: null,
      id,
      isEnabled: true,
      metadata: null,
      primaryMediaAssetId: null,
      posterMediaAssetId: null,
      projectId: "project-1",
      sortOrder: 0,
      title: id,
      type,
      createdAt: "2026-07-28T00:00:00.000Z",
      updatedAt: "2026-07-28T00:00:00.000Z",
    },
  } satisfies SectionRow;
}

const preloadMedia = buildProjectPreloadMedia({
  heroVideoAsset: {
    altText: null,
    createdAt: "2026-07-28T00:00:00.000Z",
    durationSeconds: null,
    height: null,
    id: "hero-media",
    mimeType: "video/mp4",
    projectId: null,
    sizeBytes: 1,
    storageKey: "hero.mp4",
    usageScope: "project",
    url: "https://example.com/hero.mp4",
    videoVariant: null,
    width: null,
  },
  renderedSections: [
    sectionRow("intro", "text_block", "https://example.com/intro.mp4"),
    sectionRow("chapter-1", "parallax_video", "https://example.com/chapter-1.mp4"),
    sectionRow("chapter-2", "parallax_video", "https://example.com/chapter-2.mp4"),
  ],
});

assert.deepEqual(preloadMedia, [
  { mimeType: "video/mp4", src: "https://example.com/hero.mp4" },
  { mimeType: "video/mp4", src: "https://example.com/chapter-1.mp4" },
]);

const currentDir = dirname(fileURLToPath(import.meta.url));
const scrollVideoParallaxSource = readFileSync(join(currentDir, "../ScrollVideoParallax.tsx"), "utf8");

assert.doesNotMatch(
  scrollVideoParallaxSource,
  /rootMargin:\s*"125% 0px"/,
  "scroll scrub should not start that early for every offscreen video",
);
