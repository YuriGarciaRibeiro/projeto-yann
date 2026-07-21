import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mediaUploadFieldSource = readFileSync(
  "apps/web/src/app/admin/components/MediaUploadField.tsx",
  "utf8",
);
const projectSectionFormSource = readFileSync(
  "apps/web/src/app/admin/components/ProjectSectionForm.tsx",
  "utf8",
);
const adminActionsSource = readFileSync("apps/web/src/app/admin/actions.ts", "utf8");

function getFunctionSource(source: string, name: string) {
  const start = source.indexOf(`export async function ${name}`);
  assert.notEqual(start, -1, `${name} should exist`);

  const nextExport = source.indexOf("\nexport async function ", start + 1);
  return source.slice(start, nextExport === -1 ? undefined : nextExport);
}

assert.equal(
  mediaUploadFieldSource.includes("window.confirm"),
  false,
  "media delete confirmation should use the project modal instead of the browser confirm dialog",
);

assert.match(
  mediaUploadFieldSource,
  /role="dialog"[\s\S]*media-delete-confirm-title/,
  "media delete confirmation should render an accessible project dialog",
);

assert.match(
  projectSectionFormSource,
  /deleteProjectSectionInlineAction/,
  "section deletes should use the inline action that does not redirect to the top of the page",
);

assert.doesNotMatch(
  getFunctionSource(adminActionsSource, "deleteProjectSectionInlineAction"),
  /projectStatusRedirect|redirect\(/,
  "inline section delete action should not redirect after deleting a section",
);
