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
    };

export function groupProjectSections(
  sections: ProjectSectionRow[],
): ProjectSectionRenderGroup[] {
  const groups: ProjectSectionRenderGroup[] = [];
  let index = 0;

  while (index < sections.length) {
    const section = sections[index];

    if (section.section.type !== "parallax_video") {
      groups.push({ key: section.section.id, section, sections: [section], type: "single" });
      index += 1;
      continue;
    }

    const sequence: ProjectSectionRow[] = [];

    while (sections[index]?.section.type === "parallax_video") {
      sequence.push(sections[index]);
      index += 1;
    }

    if (sequence.length === 1) {
      const [singleSection] = sequence;
      groups.push({
        key: singleSection.section.id,
        section: singleSection,
        sections: [singleSection],
        type: "single",
      });
      continue;
    }

    groups.push({
      key: `parallax-${sequence.map((row) => row.section.id).join("-")}`,
      sections: sequence,
      type: "parallax_sequence",
    });
  }

  return groups;
}
