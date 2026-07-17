import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { and, eq, like } from "drizzle-orm";

import { closeDb, getDb } from "../src/lib/db/client";
import { mediaAssets } from "../src/lib/db/schema";
import { env } from "../src/lib/env";

const OUTPUT_MIME_TYPE = "video/mp4";

function getS3Client() {
  return new S3Client({
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: true,
    region: env.S3_REGION,
  });
}

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args);
    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `${command} exited with code ${code}`));
    });
  });
}

async function getDurationSeconds(filePath: string) {
  return new Promise<number | null>((resolve) => {
    const child = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    let stdout = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }

      const duration = Number.parseFloat(stdout.trim());
      resolve(Number.isFinite(duration) ? Math.round(duration) : null);
    });
  });
}

async function optimizeVideo(inputPath: string, outputPath: string) {
  await run("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-an",
    "-vf",
    "scale='min(1920,iw)':-2",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "22",
    "-maxrate",
    "5500k",
    "-bufsize",
    "9000k",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-g",
    "12",
    "-keyint_min",
    "12",
    "-sc_threshold",
    "0",
    outputPath,
  ]);
}

async function main() {
  const db = getDb();
  const s3 = getS3Client();
  const targetStorageKey = process.env.TARGET_STORAGE_KEY?.trim();
  const videos = await db
    .select()
    .from(mediaAssets)
    .where(and(like(mediaAssets.mimeType, "video/%"), eq(mediaAssets.videoVariant, "scrub")));
  const uploadVideos = videos.filter((video) => {
    if (!video.storageKey.startsWith("uploads/")) {
      return false;
    }

    if (targetStorageKey && video.storageKey !== targetStorageKey) {
      return false;
    }

    return true;
  });

  console.log(`Found ${videos.length} scrub video assets. Optimizing ${uploadVideos.length} S3 uploads.`);

  for (const video of uploadVideos) {
    let temporaryDirectory: string | null = null;

    try {
      console.log(`Optimizing ${video.storageKey}`);
      temporaryDirectory = await mkdtemp(`${tmpdir().replace(/\/$/, "")}/paralax-existing-video-`);
      const inputPath = `${temporaryDirectory}/input-video`;
      const outputPath = `${temporaryDirectory}/output-scroll.mp4`;
      const object = await s3.send(
        new GetObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: video.storageKey,
        }),
      );

      if (!object.Body) {
        throw new Error(`S3 object has no body: ${video.storageKey}`);
      }

      const originalBuffer = Buffer.from(await object.Body.transformToByteArray());
      await writeFile(inputPath, originalBuffer);
      await optimizeVideo(inputPath, outputPath);

      const optimizedBuffer = await readFile(outputPath);
      const durationSeconds = await getDurationSeconds(outputPath);
      await s3.send(
        new PutObjectCommand({
          Body: optimizedBuffer,
          Bucket: env.S3_BUCKET,
          CacheControl: "public, max-age=31536000, immutable",
          ContentLength: optimizedBuffer.byteLength,
          ContentType: OUTPUT_MIME_TYPE,
          Key: video.storageKey,
        }),
      );

      await db
        .update(mediaAssets)
        .set({
          durationSeconds,
          mimeType: OUTPUT_MIME_TYPE,
          sizeBytes: optimizedBuffer.byteLength,
          url: `${video.url.split("?")[0]}?v=${Date.now()}`,
          videoVariant: "scrub",
        })
        .where(eq(mediaAssets.id, video.id));

      console.log(
        `Optimized ${video.storageKey}: ${originalBuffer.byteLength} -> ${optimizedBuffer.byteLength} bytes`,
      );
    } finally {
      if (temporaryDirectory) {
        await rm(temporaryDirectory, { force: true, recursive: true });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
