import assert from "node:assert/strict";

import {
  IMAGE_MAX_SIZE_BYTES,
  validateMediaUploadInput,
  validateUploadStorageKey,
  VIDEO_MAX_SIZE_BYTES,
} from "./upload-validation.ts";

assert.equal(IMAGE_MAX_SIZE_BYTES, 25 * 1024 * 1024);
assert.equal(VIDEO_MAX_SIZE_BYTES, 500 * 1024 * 1024);

assert.doesNotThrow(() => {
  validateMediaUploadInput({ mimeType: "image/jpeg", sizeBytes: IMAGE_MAX_SIZE_BYTES });
  validateMediaUploadInput({ mimeType: "video/mp4", sizeBytes: VIDEO_MAX_SIZE_BYTES });
});

assert.throws(
  () => validateMediaUploadInput({ mimeType: "application/pdf", sizeBytes: 1024 }),
  /Only JPEG, PNG, WebP, GIF, MP4, and WebM uploads are allowed\./,
);
assert.throws(
  () => validateMediaUploadInput({ mimeType: "image/png", sizeBytes: IMAGE_MAX_SIZE_BYTES + 1 }),
  /Images must be 25MB or smaller/,
);
assert.throws(
  () => validateMediaUploadInput({ mimeType: "video/webm", sizeBytes: VIDEO_MAX_SIZE_BYTES + 1 }),
  /Videos must be 500MB or smaller/,
);

assert.doesNotThrow(() => {
  validateUploadStorageKey("uploads/2026/07/123e4567-e89b-12d3-a456-426614174000-hero-image.jpg");
});

assert.throws(
  () => validateUploadStorageKey("uploads/2026/07/not-a-uuid-hero-image.jpg"),
  /Upload storage key is invalid\./,
);
