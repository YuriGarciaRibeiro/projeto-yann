import assert from "node:assert/strict";

import { getYouTubeEmbedUrl } from "./youtubeEmbed.ts";

assert.equal(
  getYouTubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
  "https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0",
);

assert.equal(
  getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ?si=abc123"),
  "https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0",
);

assert.equal(
  getYouTubeEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ"),
  "https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0",
);

assert.equal(
  getYouTubeEmbedUrl("https://youtube.com/shorts/dQw4w9WgXcQ?si=abc123"),
  "https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0",
);

assert.equal(
  getYouTubeEmbedUrl("https://m.youtube.com/shorts/dQw4w9WgXcQ?si=abc123"),
  "https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0",
);

assert.equal(getYouTubeEmbedUrl("https://example.com/watch?v=dQw4w9WgXcQ"), null);
assert.equal(getYouTubeEmbedUrl("https://www.youtube.com/watch?v=abcdef"), null);
assert.equal(getYouTubeEmbedUrl("ftp://youtube.com/watch?v=dQw4w9WgXcQ"), null);
assert.equal(getYouTubeEmbedUrl("not a url"), null);
assert.equal(getYouTubeEmbedUrl(null), null);
