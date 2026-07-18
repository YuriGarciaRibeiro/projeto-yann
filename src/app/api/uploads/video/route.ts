import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  verifySessionCookieValue,
} from "@/lib/auth/session";
import { createMediaAsset } from "@/lib/db/queries";
import { mediaUsageScopes, type MediaUsageScope } from "@/lib/db/schema";
import {
  createMediaStorageKey,
  getMediaDeliveryUrl,
  putMediaObject,
  validateMediaUploadInput,
} from "@/lib/storage/s3";

export const runtime = "nodejs";
export const maxDuration = 120;

const OUTPUT_MIME_TYPE = "video/mp4";

function getString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function parseMediaUsageScope(value: string): MediaUsageScope {
  const usageScope = mediaUsageScopes.find((scope) => scope === value);

  if (!usageScope) {
    throw new Error("Escolha onde este arquivo será usado.");
  }

  return usageScope;
}

function optimizedVideoFileName(fileName: string) {
  const extensionlessName = fileName.replace(/\.[^.]+$/, "") || "video";
  return `${extensionlessName}-rolagem.mp4`;
}

function standardVideoFileName(fileName: string) {
  const extensionlessName = fileName.replace(/\.[^.]+$/, "") || "video";
  return `${extensionlessName}-normal.mp4`;
}

function safeTemporaryFileName(fileName: string) {
  return (fileName || "input-video").replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);

    let stderr = "";

    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    ffmpeg.on("error", (error) => {
      reject(error);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || "FFmpeg não conseguiu processar o vídeo."));
    });
  });
}

function createScrubVideo(inputPath: string, outputPath: string) {
  return runFfmpeg([
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

function createStandardVideo(inputPath: string, outputPath: string) {
  return runFfmpeg([
    "-y",
    "-i",
    inputPath,
    "-vf",
    "scale='min(1920,iw)':-2",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = await verifySessionCookieValue(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (!session) {
    return NextResponse.json({ error: "Admin session required." }, { status: 401 });
  }

  let temporaryDirectory: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const altText = getString(formData, "altText");
    const usageScope = parseMediaUsageScope(getString(formData, "usageScope"));
    const projectId = usageScope === "project" ? getString(formData, "projectId") : null;

    if (!(file instanceof File)) {
      throw new Error("Escolha um vídeo para enviar.");
    }

    if (!file.type.startsWith("video/")) {
      throw new Error("Este envio otimizado aceita apenas vídeos.");
    }

    if (!altText) {
      throw new Error("Adicione um nome para identificar o arquivo.");
    }

    if (usageScope === "project" && !projectId) {
      throw new Error("Escolha um projeto para este vídeo.");
    }

    validateMediaUploadInput({ mimeType: file.type, sizeBytes: file.size });

    temporaryDirectory = await mkdtemp(`${tmpdir().replace(/\/$/, "")}/paralax-video-`);

    const inputPath = `${temporaryDirectory}/${safeTemporaryFileName(file.name || "input-video")}`;
    const scrubOutputPath = `${temporaryDirectory}/output-scroll.mp4`;
    const standardOutputPath = `${temporaryDirectory}/output-standard.mp4`;
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
    await Promise.all([
      createScrubVideo(inputPath, scrubOutputPath),
      createStandardVideo(inputPath, standardOutputPath),
    ]);

    const scrubBuffer = await readFile(scrubOutputPath);
    const standardBuffer = await readFile(standardOutputPath);
    const scrubStorageKey = createMediaStorageKey(optimizedVideoFileName(file.name || "video.mp4"));
    const standardStorageKey = createMediaStorageKey(standardVideoFileName(file.name || "video.mp4"));
    await putMediaObject({
      body: scrubBuffer,
      contentType: OUTPUT_MIME_TYPE,
      storageKey: scrubStorageKey,
    });
    await putMediaObject({
      body: standardBuffer,
      contentType: OUTPUT_MIME_TYPE,
      storageKey: standardStorageKey,
    });

    await createMediaAsset({
      altText: `${altText} - rolagem otimizado`,
      mimeType: OUTPUT_MIME_TYPE,
      projectId,
      sizeBytes: scrubBuffer.byteLength,
      storageKey: scrubStorageKey,
      usageScope,
      url: getMediaDeliveryUrl(scrubStorageKey),
      videoVariant: "scrub",
    });
    await createMediaAsset({
      altText: `${altText} - normal com áudio`,
      mimeType: OUTPUT_MIME_TYPE,
      projectId,
      sizeBytes: standardBuffer.byteLength,
      storageKey: standardStorageKey,
      usageScope,
      url: getMediaDeliveryUrl(standardStorageKey),
      videoVariant: "standard",
    });

    revalidatePath("/admin");
    if (projectId) {
      revalidatePath(`/admin/projetos/${projectId}`);
    }
    revalidatePath("/");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível otimizar e salvar o vídeo.",
      },
      { status: 400 },
    );
  } finally {
    if (temporaryDirectory) {
      await rm(temporaryDirectory, { force: true, recursive: true });
    }
  }
}
