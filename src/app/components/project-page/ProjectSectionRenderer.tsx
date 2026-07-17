import type { Project } from "@/lib/db/schema";

import type { PublishedProjectPageData } from "./ProjectPage";
import { ContactCreditSection } from "./section-renderers/ContactCreditSection";
import { ImageBlockSection } from "./section-renderers/ImageBlockSection";
import { ParallaxVideoSection } from "./section-renderers/ParallaxVideoSection";
import { TechnicalInfoSection } from "./section-renderers/TechnicalInfoSection";
import { TextBlockSection } from "./section-renderers/TextBlockSection";
import { VideoBlockSection } from "./section-renderers/VideoBlockSection";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];

type ProjectSectionRendererProps = {
  overlapPrevious?: boolean;
  project: Project;
  sectionRow: ProjectSectionRow;
};

export function ProjectSectionRenderer({
  overlapPrevious = false,
  project,
  sectionRow,
}: ProjectSectionRendererProps) {
  switch (sectionRow.section.type) {
    case "parallax_video":
      return <ParallaxVideoSection overlapPrevious={overlapPrevious} sectionRow={sectionRow} />;
    case "video_block":
      return <VideoBlockSection sectionRow={sectionRow} />;
    case "image_block":
      return <ImageBlockSection sectionRow={sectionRow} />;
    case "text_block":
      return <TextBlockSection sectionRow={sectionRow} />;
    case "technical_info":
      return <TechnicalInfoSection project={project} sectionRow={sectionRow} />;
    case "contact_credit":
      return <ContactCreditSection project={project} sectionRow={sectionRow} />;
    default:
      return null;
  }
}
