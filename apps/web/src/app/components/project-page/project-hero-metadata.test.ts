import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const projectHeroSource = readFileSync(
  "apps/web/src/app/components/project-page/ProjectHero.tsx",
  "utf8",
);

assert.match(
  projectHeroSource,
  /const heroMetadata = \[\s*project\.heroDisplayName,\s*project\.category,\s*project\.location,\s*project\.year,\s*\]/,
  "hero metadata should include hero display name before category, location, and year",
);

assert.match(
  projectHeroSource,
  /heroMetadata\.length > 0[\s\S]*heroMetadata\.join\(" \/ "\)/,
  "hero metadata should join only available values without leftover separators",
);

assert.doesNotMatch(
  projectHeroSource,
  /<dl[\s\S]*HeroFact/,
  "hero should not render the lateral facts table",
);

assert.doesNotMatch(
  projectHeroSource,
  /function HeroFact/,
  "HeroFact should be removed when the lateral facts table is removed",
);

assert.doesNotMatch(
  projectHeroSource,
  /Produzido por Yann|Archviz Studio/,
  "hero should not render the production credit text",
);
