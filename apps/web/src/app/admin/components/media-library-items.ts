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
const storageFilePrefixPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-/i;
const storageVideoVariantPattern = /-(rolagem|normal)\.[^.]+$/i;

function getStorageFileBaseName(storageKey: string) {
  const fileName = storageKey.split("/").at(-1) ?? storageKey;
  const withoutUuid = fileName.replace(storageFilePrefixPattern, "");
  const withoutVariant = withoutUuid.replace(storageVideoVariantPattern, "");
  return withoutVariant || withoutUuid;
}

function normalizeGroupName(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function getVideoGroupingName(asset: AdminMediaAsset, displayName: string) {
  const rawFileName = asset.storageKey.split("/").at(-1);
  const storageFileBaseName = getStorageFileBaseName(asset.storageKey);
  const storageDisplayName = storageFileBaseName.replaceAll("-", " ").trim();

  if (
    storageFileBaseName !== rawFileName &&
    normalizeGroupName(displayName) === normalizeGroupName(storageDisplayName)
  ) {
    return storageFileBaseName;
  }

  return displayName;
}

function isVideoVariantAsset(asset: AdminMediaAsset) {
  return Boolean(asset.videoVariant) || storageVideoVariantPattern.test(asset.storageKey);
}

export function getDisplayNameFromAsset(asset: AdminMediaAsset) {
  return asset.altText
    .replace(videoVariantLabelPattern, "")
    .replace(/-(rolagem|normal)$/i, "")
    .trim();
}

export function getLibraryItems(mediaAssets: AdminMediaAsset[]) {
  const items = new Map<string, LibraryItem>();

  for (const asset of mediaAssets) {
    const displayName = getDisplayNameFromAsset(asset);
    const groupingKey = isVideoVariantAsset(asset)
      ? [
          asset.usageScope,
          asset.projectId ?? "site",
          asset.mimeType,
          getVideoGroupingName(asset, displayName),
        ].join(":")
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
