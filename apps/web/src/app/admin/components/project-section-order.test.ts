import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const projectSectionFormSource = readFileSync(
  "apps/web/src/app/admin/components/ProjectSectionForm.tsx",
  "utf8",
);
const adminActionsSource = readFileSync("apps/web/src/app/admin/actions.ts", "utf8");

assert.match(
  projectSectionFormSource,
  /const submittedSortOrder =\s*sectionData \? String\(sectionData\.sortOrder\) : String\(visibleOrder\);/,
  "editing a block should submit its persisted sortOrder instead of its visual index",
);

assert.match(
  projectSectionFormSource,
  /<input name="sortOrder" type="hidden" value=\{submittedSortOrder\} \/>/,
  "the hidden sortOrder input should use the persisted-or-visual submittedSortOrder value",
);

assert.match(
  adminActionsSource,
  /const sectionId = nullableString\(getString\(formData, "id"\)\) \?\? undefined;[\s\S]*const submittedSortOrder = sectionId \? sortOrder : sortOrder \* 10;/,
  "section updates should preserve submitted sortOrder while new sections still get spaced ordering",
);

assert.match(
  adminActionsSource,
  /id: sectionId,[\s\S]*sortOrder: submittedSortOrder,/,
  "section save should send the computed submittedSortOrder to the API",
);
