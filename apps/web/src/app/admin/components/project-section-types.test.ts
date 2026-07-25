import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const projectSectionFormSource = readFileSync(
  "apps/web/src/app/admin/components/ProjectSectionForm.tsx",
  "utf8",
);

assert.match(
  projectSectionFormSource,
  /const creatableProjectSectionTypes = projectSectionTypes\.filter\(\s*\(type\) => type !== "contact_credit",\s*\);/,
  "admin block creation should exclude contact_credit from selectable section types",
);

assert.match(
  projectSectionFormSource,
  /types=\{isEditing \? projectSectionTypes : creatableProjectSectionTypes\}/,
  "section type select should keep legacy contact_credit editable while excluding it from new blocks",
);

assert.match(
  projectSectionFormSource,
  /\{types\.map\(\(type\) => \(/,
  "section type select should render the provided section type list",
);
