import type { AdminMediaAsset } from "@/lib/api/admin-media";
import type { MediaUsageScope } from "@/lib/api/project-types";

export type LibraryItem = {
  assets: AdminMediaAsset[];
  displayName: string;
  id: string;
  mimeType: string;
  usageScope: MediaUsageScope;
  url: string;
};

const videoVariantLabelPattern = / - (rolagem otimizado|normal com áudio)$/;

export function getDisplayNameFromAsset(asset: AdminMediaAsset) {
  return asset.altText.replace(videoVariantLabelPattern, "");
}

export function getLibraryItems(mediaAssets: AdminMediaAsset[]) {
  const items = new Map<string, LibraryItem>();

  for (const asset of mediaAssets) {
    const displayName = getDisplayNameFromAsset(asset);
    const groupingKey = asset.videoVariant
      ? [asset.usageScope, asset.projectId ?? "site", asset.mimeType, displayName].join(":")
      : asset.id;
    const existingItem = items.get(groupingKey);

    if (existingItem) {
      existingItem.assets.push(asset);
      const standardAsset = existingItem.assets.find((itemAsset) => itemAsset.videoVariant === "standard");
      if (standardAsset) {
        existingItem.url = standardAsset.url;
      }
      continue;
    }

    items.set(groupingKey, {
      assets: [asset],
      displayName,
      id: asset.id,
      mimeType: asset.mimeType,
      usageScope: asset.usageScope,
      url: asset.url,
    });
  }

  return Array.from(items.values());
}
