import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";

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

const MAX_FILENAME_LENGTH = 120;
const UPLOAD_STORAGE_KEY_PATTERN =
  /^uploads\/\d{4}\/\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-[a-z0-9._-]{1,120}$/i;

let s3Client: S3Client | null = null;

export function isAllowedMediaMimeType(mimeType: string) {
  return ALLOWED_UPLOAD_MIME_TYPES.includes(
    mimeType as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number],
  );
}

export function validateMediaUploadInput(input: {
  mimeType: string;
  sizeBytes: number;
}) {
  if (!isAllowedMediaMimeType(input.mimeType)) {
    throw new Error("Only JPEG, PNG, WebP, GIF, MP4, and WebM uploads are allowed.");
  }

  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    throw new Error("Upload size must be greater than zero.");
  }

  const maxSize = input.mimeType.startsWith("image/")
    ? IMAGE_MAX_SIZE_BYTES
    : VIDEO_MAX_SIZE_BYTES;

  if (input.sizeBytes > maxSize) {
    throw new Error(
      input.mimeType.startsWith("image/")
        ? "Images must be 25MB or smaller."
        : "Videos must be 500MB or smaller.",
    );
  }
}

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: true,
      region: env.S3_REGION,
    });
  }

  return s3Client;
}

function encodeStorageKey(storageKey: string) {
  return storageKey.split("/").map(encodeURIComponent).join("/");
}

function sanitizeFileName(fileName: string) {
  const normalized = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return (normalized || "upload").slice(0, MAX_FILENAME_LENGTH);
}

export function validateUploadStorageKey(storageKey: string) {
  if (!UPLOAD_STORAGE_KEY_PATTERN.test(storageKey)) {
    throw new Error("Upload storage key is invalid.");
  }
}

export function createMediaStorageKey(fileName: string, now = new Date()) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");

  return `uploads/${year}/${month}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}

export function getPublicMediaUrl(storageKey: string) {
  const encodedKey = encodeStorageKey(storageKey);
  const publicBaseUrl = env.S3_PUBLIC_BASE_URL;

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/+$/, "")}/${encodedKey}`;
  }

  const endpoint = new URL(env.S3_ENDPOINT);
  const endpointPath = endpoint.pathname.replace(/^\/+|\/+$/g, "");
  const basePath = endpointPath ? `/${endpointPath}` : "";

  if (endpoint.hostname === "s3.amazonaws.com") {
    return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${encodedKey}`;
  }

  return `${endpoint.origin}${basePath}/${env.S3_BUCKET}/${encodedKey}`;
}

export function getMediaDeliveryUrl(storageKey: string) {
  validateUploadStorageKey(storageKey);

  if (env.S3_PUBLIC_BASE_URL) {
    return getPublicMediaUrl(storageKey);
  }

  return `/api/media/${encodeStorageKey(storageKey)}`;
}

export async function createSignedPutUpload(input: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  validateMediaUploadInput(input);

  const storageKey = createMediaStorageKey(input.fileName);
  validateUploadStorageKey(storageKey);
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    ContentLength: input.sizeBytes,
    ContentType: input.mimeType,
    Key: storageKey,
  });

  return {
    storageKey,
    uploadUrl: await getSignedUrl(getS3Client(), command, { expiresIn: 60 * 5 }),
    url: getMediaDeliveryUrl(storageKey),
  };
}

export async function putMediaObject(input: {
  body: Buffer;
  contentType: string;
  storageKey: string;
}) {
  validateUploadStorageKey(input.storageKey);
  await getS3Client().send(
    new PutObjectCommand({
      Body: input.body,
      Bucket: env.S3_BUCKET,
      CacheControl: "public, max-age=31536000, immutable",
      ContentLength: input.body.byteLength,
      ContentType: input.contentType,
      Key: input.storageKey,
    }),
  );
}

export async function headMediaObject(storageKey: string) {
  validateUploadStorageKey(storageKey);

  try {
    return await getS3Client().send(
      new HeadObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
      }),
    );
  } catch {
    throw new Error("Uploaded object could not be verified.");
  }
}

export async function getMediaObject(input: { range?: string | null; storageKey: string }) {
  validateUploadStorageKey(input.storageKey);

  return getS3Client().send(
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: input.storageKey,
      Range: input.range ?? undefined,
    }),
  );
}

export async function deleteMediaObjects(storageKeys: string[]) {
  const uniqueStorageKeys = [...new Set(storageKeys)];

  if (uniqueStorageKeys.length === 0) {
    return;
  }

  for (const storageKey of uniqueStorageKeys) {
    validateUploadStorageKey(storageKey);
  }

  for (let index = 0; index < uniqueStorageKeys.length; index += 1000) {
    const batch = uniqueStorageKeys.slice(index, index + 1000);
    await getS3Client().send(
      new DeleteObjectsCommand({
        Bucket: env.S3_BUCKET,
        Delete: {
          Objects: batch.map((storageKey) => ({ Key: storageKey })),
          Quiet: true,
        },
      }),
    );
  }
}

export async function verifyUploadedMediaObject(input: {
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
}) {
  validateMediaUploadInput(input);

  const object = await headMediaObject(input.storageKey);

  if (object.ContentType && object.ContentType !== input.mimeType) {
    throw new Error("Uploaded object content type does not match metadata.");
  }

  if (typeof object.ContentLength === "number" && object.ContentLength !== input.sizeBytes) {
    throw new Error("Uploaded object size does not match metadata.");
  }
}
