import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const footerSource = readFileSync(
  "apps/web/src/app/components/project-page/section-renderers/ProjectContactCreditFooter.tsx",
  "utf8",
);

assert.match(
  footerSource,
  /<p className="text-label font-medium uppercase tracking-\[0\.16em\] text-white\/45">\s*Arquiteto\(a\)\s*<\/p>/,
  "contact credit footer should label the credit area as Arquiteto(a)",
);

assert.doesNotMatch(
  footerSource,
  /<ContactRow label="Arquiteto\(a\)" value=\{project\.clientArchitectName\} \/>/,
  "contact credit footer should not repeat Arquiteto(a) inside the contact table",
);

assert.match(
  footerSource,
  /<\/h2>\s*<p className="mt-4 text-label uppercase tracking-\[0\.18em\] text-white">\s*Produzido por Yann \| Archviz Studio\s*<\/p>/,
  "production credit should appear directly below the architect name in white",
);

assert.doesNotMatch(
  footerSource,
  /<p className="mt-12 text-label uppercase tracking-\[0\.18em\] text-white\/40">\s*Produzido por Yann \| Archviz Studio\s*<\/p>/,
  "production credit should not remain below the contact table in muted text",
);
