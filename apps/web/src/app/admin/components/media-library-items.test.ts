import assert from "node:assert/strict";

import { getLibraryItems } from "./media-library-items.ts";

const baseAsset = {
  createdAt: "2026-07-21T00:00:00Z",
  durationSeconds: null,
  height: null,
  mimeType: "video/mp4",
  projectId: "project-id",
  sizeBytes: 1024,
  usageScope: "project" as const,
  width: null,
};

const items = getLibraryItems([
  {
    ...baseAsset,
    altText: "Video arquitetonico - rolagem otimizado",
    id: "scrub-1",
    storageKey: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174001-video-rolagem.mp4",
    url: "https://example.com/video-1-rolagem.mp4",
    videoVariant: "scrub" as const,
  },
  {
    ...baseAsset,
    altText: "Video arquitetonico - normal com áudio",
    id: "standard-1",
    storageKey: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174002-video-normal.mp4",
    url: "https://example.com/video-1-normal.mp4",
    videoVariant: "standard" as const,
  },
  {
    ...baseAsset,
    altText: "Video arquitetonico - rolagem otimizado",
    id: "scrub-2",
    storageKey: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174003-video-rolagem.mp4",
    url: "https://example.com/video-2-rolagem.mp4",
    videoVariant: "scrub" as const,
  },
  {
    ...baseAsset,
    altText: "Video arquitetonico - normal com áudio",
    id: "standard-2",
    storageKey: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174004-video-normal.mp4",
    url: "https://example.com/video-2-normal.mp4",
    videoVariant: "standard" as const,
  },
]);

assert.equal(items.length, 4, "every saved video asset must remain visible in the library");
assert.deepEqual(
  items.map((item) => item.assets.map((asset) => asset.id)),
  [
    ["scrub-1"],
    ["standard-1"],
    ["scrub-2"],
    ["standard-2"],
  ],
  "library rows should match database rows instead of collapsing videos by repeated titles",
);

assert.deepEqual(
  items.map((item) => item.id),
  ["scrub-1", "standard-1", "scrub-2", "standard-2"],
  "library rows should expose stable asset ids for row actions",
);
