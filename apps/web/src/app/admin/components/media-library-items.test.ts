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
    altText: "Video sala - rolagem otimizado",
    id: "scrub-1",
    storageKey: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174001-video-rolagem.mp4",
    url: "https://example.com/video-1-rolagem.mp4",
    videoVariant: "scrub" as const,
  },
  {
    ...baseAsset,
    altText: "Video sala - normal com áudio",
    id: "standard-1",
    storageKey: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174002-video-normal.mp4",
    url: "https://example.com/video-1-normal.mp4",
    videoVariant: "standard" as const,
  },
  {
    ...baseAsset,
    altText: "Video cozinha - rolagem otimizado",
    id: "scrub-2",
    storageKey: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174003-video-rolagem.mp4",
    url: "https://example.com/video-2-rolagem.mp4",
    videoVariant: "scrub" as const,
  },
  {
    ...baseAsset,
    altText: "Video cozinha - normal com áudio",
    id: "standard-2",
    storageKey: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174004-video-normal.mp4",
    url: "https://example.com/video-2-normal.mp4",
    videoVariant: "standard" as const,
  },
]);

const legacyItems = getLibraryItems([
  {
    ...baseAsset,
    altText: "video-casa-rolagem",
    id: "legacy-scrub",
    storageKey: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174005-video-casa-rolagem.mp4",
    url: "https://example.com/video-casa-rolagem.mp4",
    videoVariant: null,
  },
  {
    ...baseAsset,
    altText: "video-casa-normal",
    id: "legacy-standard",
    storageKey: "uploads/2026/07/123e4567-e89b-12d3-a456-426614174006-video-casa-normal.mp4",
    url: "https://example.com/video-casa-normal.mp4",
    videoVariant: null,
  },
]);

assert.equal(items.length, 2, "video variants should be grouped as one visible library item");
assert.deepEqual(
  items.map((item) => item.assets.map((asset) => asset.id)),
  [
    ["scrub-1", "standard-1"],
    ["scrub-2", "standard-2"],
  ],
  "library rows should keep both video variants inside the grouped item",
);

assert.deepEqual(
  items.map((item) => item.id),
  ["scrub-1", "scrub-2"],
  "library rows should expose stable asset ids for row actions",
);

assert.deepEqual(
  items.map((item) => item.displayName),
  ["Video sala", "Video cozinha"],
  "library rows should hide technical video variant labels from admins",
);

assert.equal(
  legacyItems.length,
  1,
  "legacy video variants should be grouped from their storage file names even without videoVariant metadata",
);
assert.deepEqual(
  legacyItems[0]?.assets.map((asset) => asset.id),
  ["legacy-scrub", "legacy-standard"],
  "legacy grouped video rows should keep both storage variants",
);
