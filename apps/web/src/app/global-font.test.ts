import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const layoutSource = readFileSync("apps/web/src/app/layout.tsx", "utf8");
const globalsSource = readFileSync("apps/web/src/app/globals.css", "utf8");

assert.match(
  layoutSource,
  /import \{ Open_Sans \} from "next\/font\/google";/,
  "root layout should load Open Sans from next/font/google",
);

assert.match(
  layoutSource,
  /const openSans = Open_Sans\(\{[\s\S]*variable: "--font-open-sans",[\s\S]*subsets: \["latin"\],[\s\S]*\}\);/,
  "root layout should expose Open Sans as a global CSS variable",
);

assert.match(
  layoutSource,
  /className=\{`\$\{openSans\.variable\} h-full antialiased`\}/,
  "root html element should apply the Open Sans font variable",
);

assert.match(
  globalsSource,
  /--font-display: var\(--font-open-sans\), Arial, sans-serif;/,
  "display font token should use Open Sans",
);

assert.match(
  globalsSource,
  /--font-sans: var\(--font-open-sans\), Arial, sans-serif;/,
  "sans font token should use Open Sans",
);

assert.match(
  globalsSource,
  /--font-mono: var\(--font-open-sans\), Arial, sans-serif;/,
  "mono font token should use Open Sans so all font utilities stay consistent",
);
