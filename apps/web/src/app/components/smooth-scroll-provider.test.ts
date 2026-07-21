import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const smoothScrollProviderSource = readFileSync(
  "apps/web/src/app/components/SmoothScrollProvider.tsx",
  "utf8",
);

assert.match(
  smoothScrollProviderSource,
  /pathname\.startsWith\("\/admin"\)/,
  "smooth scroll should stay disabled in admin routes",
);

assert.match(
  smoothScrollProviderSource,
  /prefers-reduced-motion: reduce/,
  "smooth scroll should respect reduced motion preferences",
);

assert.match(
  smoothScrollProviderSource,
  /lerp: 0\.08[\s\S]*wheelMultiplier: 0\.9[\s\S]*touchMultiplier: 1\.2/,
  "Lenis should keep the calibrated smooth scroll settings that work across pointer types",
);
