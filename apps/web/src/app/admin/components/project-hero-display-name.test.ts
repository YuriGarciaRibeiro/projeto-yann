import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const projectFormSource = readFileSync("apps/web/src/app/admin/components/ProjectForm.tsx", "utf8");
const adminActionsSource = readFileSync("apps/web/src/app/admin/actions.ts", "utf8");
const adminProjectApiSource = readFileSync("apps/web/src/lib/api/admin-projects.ts", "utf8");
const publicProjectApiSource = readFileSync("apps/web/src/lib/api/public-projects.ts", "utf8");

assert.match(
  projectFormSource,
  /label="Apelido da Hero"[\s\S]*name="heroDisplayName"/,
  "project form should expose a Hero nickname field",
);

assert.match(
  adminActionsSource,
  /\| "heroDisplayName"/,
  "project form state should include heroDisplayName",
);

assert.match(
  adminActionsSource,
  /heroDisplayName: getString\(formData, "heroDisplayName"\)/,
  "project form values should read heroDisplayName from form data",
);

assert.match(
  adminActionsSource,
  /heroDisplayName: nullableString\(values\.heroDisplayName\)/,
  "project upsert input should send nullable heroDisplayName",
);

assert.match(
  adminProjectApiSource,
  /heroDisplayName: string \| null/,
  "admin project type should include heroDisplayName",
);

assert.match(
  publicProjectApiSource,
  /heroDisplayName: string \| null/,
  "public project type should include heroDisplayName",
);

assert.match(
  projectFormSource,
  /<div className="grid min-w-0 grid-rows-\[auto_auto_minmax\(1\.25rem,_auto\)\] gap-2">/,
  "project text fields should reserve a stable help-text row so adjacent inputs stay aligned",
);
