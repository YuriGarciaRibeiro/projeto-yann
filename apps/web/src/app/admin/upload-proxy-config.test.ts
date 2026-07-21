import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const nextConfigSource = readFileSync("apps/web/next.config.ts", "utf8");

assert.match(
  nextConfigSource,
  /proxyClientMaxBodySize:\s*["']501mb["']/,
  "video uploads pass through the admin proxy, so proxyClientMaxBodySize must allow full 500MB videos",
);

assert.doesNotMatch(
  nextConfigSource,
  /middlewareClientMaxBodySize/,
  "Next 16 renamed middlewareClientMaxBodySize to proxyClientMaxBodySize",
);
