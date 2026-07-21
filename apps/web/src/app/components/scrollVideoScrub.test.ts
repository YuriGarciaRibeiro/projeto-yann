import assert from "node:assert/strict";

import {
  MAX_SCROLL_HEIGHT_SVH,
  MIN_SCROLL_HEIGHT_SVH,
  SCROLL_HEIGHT_PER_SECOND_SVH,
  getScrubScrollHeightSvh,
} from "./scrollVideoScrub.ts";

assert.equal(MIN_SCROLL_HEIGHT_SVH, 360);
assert.equal(SCROLL_HEIGHT_PER_SECOND_SVH, 75);
assert.equal(MAX_SCROLL_HEIGHT_SVH, 760);
assert.equal(getScrubScrollHeightSvh(2), 360);
assert.equal(getScrubScrollHeightSvh(5), 375);
assert.equal(getScrubScrollHeightSvh(20), 760);
