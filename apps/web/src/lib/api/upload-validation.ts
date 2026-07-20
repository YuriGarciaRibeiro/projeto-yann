export const IMAGE_MAX_SIZE_BYTES = 25 * 1024 * 1024;
export const VIDEO_MAX_SIZE_BYTES = 500 * 1024 * 1024;
export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
] as const;

const UPLOAD_STORAGE_KEY_PATTERN =
  /^uploads\/\d{4}\/\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-[a-z0-9._-]{1,120}$/i;

function isAllowedMediaMimeType(mimeType: string) {
  return ALLOWED_UPLOAD_MIME_TYPES.some((allowedType) => allowedType === mimeType);
}

export function validateMediaUploadInput(input: { mimeType: string; sizeBytes: number }) {
  if (!isAllowedMediaMimeType(input.mimeType)) {
    throw new Error("Only JPEG, PNG, WebP, GIF, MP4, and WebM uploads are allowed.");
  }

  if (Number.isNaN(input.sizeBytes) || input.sizeBytes <= 0) {
    throw new Error("Upload size must be greater than zero.");
  }

  const maxSize = input.mimeType.startsWith("image/") ? IMAGE_MAX_SIZE_BYTES : VIDEO_MAX_SIZE_BYTES;
  if (input.sizeBytes > maxSize) {
    if (input.mimeType.startsWith("image/")) {
      throw new Error("Images must be 25MB or smaller.");
    }

    throw new Error("Videos must be 500MB or smaller.");
  }
}

export function validateUploadStorageKey(storageKey: string) {
  if (!UPLOAD_STORAGE_KEY_PATTERN.test(storageKey)) {
    throw new Error("Upload storage key is invalid.");
  }
}
