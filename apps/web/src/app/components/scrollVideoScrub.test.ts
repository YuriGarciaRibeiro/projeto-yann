import assert from "node:assert/strict";

import {
  MAX_SCROLL_HEIGHT_SVH,
  MIN_SCROLL_HEIGHT_SVH,
  SCROLL_HEIGHT_PER_SECOND_SVH,
  getScrubScrollHeightSvh,
} from "./scrollVideoScrub.ts";

assert.equal(MIN_SCROLL_HEIGHT_SVH, 260);
assert.equal(SCROLL_HEIGHT_PER_SECOND_SVH, 55);
assert.equal(MAX_SCROLL_HEIGHT_SVH, 600);
assert.equal(getScrubScrollHeightSvh(2), 260);
assert.equal(getScrubScrollHeightSvh(5), 275);
assert.equal(getScrubScrollHeightSvh(20), 600);
