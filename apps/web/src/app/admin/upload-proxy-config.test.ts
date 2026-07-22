import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const nextConfigSource = readFileSync("apps/web/next.config.ts", "utf8");

assert.doesNotMatch(
  nextConfigSource,
  /proxyClientMaxBodySize/,
  "video uploads go directly to storage, so Next must not keep a proxy body allowance",
);

assert.doesNotMatch(
  nextConfigSource,
  /bodySizeLimit/,
  "video uploads go directly to storage, so Server Actions must not keep a body allowance",
);

assert.doesNotMatch(
  nextConfigSource,
  /middlewareClientMaxBodySize/,
  "Next 16 renamed middlewareClientMaxBodySize to proxyClientMaxBodySize",
);
