export const mediaUsageScopes = ["site", "project"] as const;

export type MediaUsageScope = (typeof mediaUsageScopes)[number];

export const videoVariants = ["standard", "scrub"] as const;

export type VideoVariant = (typeof videoVariants)[number];

export const projectSectionTypes = [
  "parallax_video",
  "video_block",
  "image_block",
  "text_block",
  "technical_info",
  "contact_credit",
] as const;

export type ProjectSectionType = (typeof projectSectionTypes)[number];
