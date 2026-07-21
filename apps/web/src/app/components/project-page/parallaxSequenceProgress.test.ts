import assert from "node:assert/strict";

import { getParallaxSequenceProgress, getTotalSegmentScrollHeight } from "./parallaxSequenceProgress";

assert.equal(getTotalSegmentScrollHeight([260, 330, 440]), 1030);

assert.deepEqual(getParallaxSequenceProgress([100, 300], 0), {
  activeIndex: 0,
  localProgress: 0,
});

assert.deepEqual(getParallaxSequenceProgress([100, 300], 0.25), {
  activeIndex: 0,
  localProgress: 1,
});

assert.deepEqual(getParallaxSequenceProgress([100, 300], 0.625), {
  activeIndex: 1,
  localProgress: 0.5,
});

assert.deepEqual(getParallaxSequenceProgress([100, 300], 1), {
  activeIndex: 1,
  localProgress: 1,
});

assert.deepEqual(getParallaxSequenceProgress([], 0.5), {
  activeIndex: 0,
  localProgress: 0,
});
