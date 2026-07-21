import assert from "node:assert/strict";

import { groupProjectSections } from "./groupProjectSections";
import type { PublishedProjectPageData } from "./ProjectPage";

type SectionRow = PublishedProjectPageData["sections"][number];

function sectionRow(id: string, type: SectionRow["section"]["type"]): SectionRow {
  return {
    primaryMediaAsset: null,
    posterMediaAsset: null,
    section: {
      body: null,
      caption: null,
      id,
      sortOrder: 0,
      title: id,
      type,
    },
  } satisfies SectionRow;
}

const grouped = groupProjectSections([
  sectionRow("intro", "text_block"),
  sectionRow("video-1", "parallax_video"),
  sectionRow("video-2", "parallax_video"),
  sectionRow("image", "image_block"),
  sectionRow("video-3", "parallax_video"),
]);

assert.deepEqual(
  grouped.map((group) => ({
    ids: group.sections.map((row) => row.section.id),
    type: group.type,
  })),
  [
    { ids: ["intro"], type: "single" },
    { ids: ["video-1", "video-2"], type: "parallax_sequence" },
    { ids: ["image"], type: "single" },
    { ids: ["video-3"], type: "single" },
  ],
);

assert.equal(grouped[1]?.key, "parallax-video-1-video-2");
assert.equal(groupProjectSections([]).length, 0);
