import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(currentDir, "ProjectPreloader.tsx"), "utf8");

assert.doesNotMatch(source, /unoptimized/, "the loading logo should use Next image optimization");
