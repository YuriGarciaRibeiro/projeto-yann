import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const projectSectionFormSource = readFileSync(
  "apps/web/src/app/admin/components/ProjectSectionForm.tsx",
  "utf8",
);
const adminActionsSource = readFileSync("apps/web/src/app/admin/actions.ts", "utf8");

function getObjectSource(source: string, key: string) {
  const start = source.indexOf(`  ${key}: {`);
  assert.notEqual(start, -1, `${key} config should exist`);

  const end = source.indexOf("\n  },", start);
  assert.notEqual(end, -1, `${key} config should have an object terminator`);
  return source.slice(start, end);
}

assert.match(
  getObjectSource(projectSectionFormSource, "video_block"),
  /youtubeUrl: true/,
  "video block admin form should collect a YouTube URL instead of uploaded primary video media",
);

assert.doesNotMatch(
  getObjectSource(projectSectionFormSource, "video_block"),
  /primaryMedia/,
  "video block admin form should not request an uploaded primary video",
);

assert.match(
  projectSectionFormSource,
  /const hiddenPrimaryMediaAssetId =\s*sectionData\?\.type === "video_block" && selectedType === "video_block"[\s\S]*sectionData\.primaryMediaAssetId \?\? ""[\s\S]*: "";/,
  "video block admin form should preserve fallback media only for existing video blocks",
);

assert.match(
  projectSectionFormSource,
  /<input name="primaryMediaAssetId" type="hidden" value=\{hiddenPrimaryMediaAssetId\} \/>/,
  "hidden primary media submission should use the preserved value",
);

assert.match(
  projectSectionFormSource,
  /name="youtubeUrl"/,
  "project section form should include the YouTube URL field in submitted form data",
);

assert.match(
  adminActionsSource,
  /youtubeUrl[\s\S]*type === "video_block"[\s\S]*youtubeUrl/,
  "section save action should merge youtubeUrl into metadata only for video blocks",
);
