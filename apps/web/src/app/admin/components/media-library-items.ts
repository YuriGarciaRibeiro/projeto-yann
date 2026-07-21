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

export function getDisplayNameFromAsset(asset: AdminMediaAsset) {
  return asset.altText;
}

export function getLibraryItems(mediaAssets: AdminMediaAsset[]) {
  return mediaAssets.map((asset) => ({
      assets: [asset],
      displayName: getDisplayNameFromAsset(asset),
      id: asset.id,
      mimeType: asset.mimeType,
      usageScope: asset.usageScope,
      url: asset.url,
    }));
}
