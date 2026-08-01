import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const footerSource = readFileSync(
  "apps/web/src/app/components/project-page/section-renderers/ProjectContactCreditFooter.tsx",
  "utf8",
);

assert.match(
  footerSource,
  /<h2\s+className="mt-5 font-display text-section-title font-normal leading-\[1\] tracking-\[-0\.045em\]"/,
  "contact credit footer should keep the architect name as the primary headline",
);

assert.doesNotMatch(
  footerSource,
  /Arquiteto\(a\)/,
  "contact credit footer should not render the Arquiteto(a) label anymore",
);

assert.match(
  footerSource,
  /const showProductionCreditAtEnd = !mediaAsset;[\s\S]*!showProductionCreditAtEnd \? \([\s\S]*<p className="mt-4 text-label uppercase tracking-\[0\.18em\] text-white\/40">[\s\S]*Yann \| Archviz Studio[\s\S]*<p className="mt-10 text-label uppercase tracking-\[0\.18em\] text-white\/40">[\s\S]*Yann \| Archviz Studio[\s\S]*instagram\.com\/yann_archviz\//,
  "production credit should stay below the name when there is media and move to the end when there is no media",
);

assert.doesNotMatch(
  footerSource,
  /<div className="mx-auto mt-12 flex max-w-\[1440px\] border-t border-white\/10 pt-6 lg:mt-16">/,
  "production credit should not remain in a separate lower footer row",
);
