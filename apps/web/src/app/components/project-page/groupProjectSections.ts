import type { PublishedProjectPageData } from "./ProjectPage";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];

export type ProjectSectionRenderGroup =
  | {
      key: string;
      section: ProjectSectionRow;
      sections: [ProjectSectionRow];
      type: "single";
    }
  | {
      key: string;
      sections: ProjectSectionRow[];
      type: "parallax_sequence";
    }
  | {
      key: string;
      sections: ProjectSectionRow[];
      type: "manual_parallax_group";
    };

function parallaxGroupItemToSectionRow(
  sectionRow: ProjectSectionRow,
  itemRow: ProjectSectionRow["parallaxGroupItems"][number],
): ProjectSectionRow {
  return {
    section: {
      ...sectionRow.section,
      id: itemRow.item.id,
      sortOrder: itemRow.item.sortOrder,
      type: "parallax_video",
      title: itemRow.item.title,
      body: itemRow.item.body,
      primaryMediaAssetId: itemRow.item.primaryMediaAssetId,
      posterMediaAssetId: itemRow.item.posterMediaAssetId,
      caption: itemRow.item.caption,
      isEnabled: itemRow.item.isEnabled,
      createdAt: itemRow.item.createdAt,
      updatedAt: itemRow.item.updatedAt,
    },
    primaryMediaAsset: itemRow.primaryMediaAsset,
    posterMediaAsset: itemRow.posterMediaAsset,
    parallaxGroupItems: [],
  };
}

function pushParallaxSequence(
  groups: ProjectSectionRenderGroup[],
  sequence: ProjectSectionRow[],
) {
  if (sequence.length === 0) {
    return;
  }

  if (sequence.length === 1) {
    const [singleSection] = sequence;
    groups.push({
      key: singleSection.section.id,
      section: singleSection,
      sections: [singleSection],
      type: "single",
    });
    return;
  }

  groups.push({
    key: `parallax-${sequence.map((row) => row.section.id).join("-")}`,
    sections: sequence,
    type: "parallax_sequence",
  });
}

export function groupProjectSections(
  sections: ProjectSectionRow[],
): ProjectSectionRenderGroup[] {
  const groups: ProjectSectionRenderGroup[] = [];
  let looseParallaxSequence: ProjectSectionRow[] = [];

  for (const section of sections) {
    if (section.section.type === "parallax_video") {
      looseParallaxSequence.push(section);
      continue;
    }

    pushParallaxSequence(groups, looseParallaxSequence);
    looseParallaxSequence = [];

    if (section.section.type === "parallax_group") {
      const convertedRows = section.parallaxGroupItems
        .filter((itemRow) => itemRow.item.isEnabled)
        .map((itemRow) => parallaxGroupItemToSectionRow(section, itemRow));

      if (convertedRows.length === 1) {
        const [singleSection] = convertedRows;
        groups.push({
          key: section.section.id,
          section: singleSection,
          sections: [singleSection],
          type: "single",
        });
      } else if (convertedRows.length > 1) {
        groups.push({
          key: `manual-parallax-${section.section.id}`,
          sections: convertedRows,
          type: "manual_parallax_group",
        });
      }

      continue;
    }

    groups.push({ key: section.section.id, section, sections: [section], type: "single" });
  }

  pushParallaxSequence(groups, looseParallaxSequence);

  return groups;
}
