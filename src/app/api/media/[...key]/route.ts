import { NextResponse } from "next/server";

import { getMediaObject, headMediaObject, validateUploadStorageKey } from "@/lib/storage/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RANGE_PATTERN = /^bytes=\d*-\d*$/;

function streamFromBody(body: unknown) {
  if (
    body &&
    typeof body === "object" &&
    "transformToWebStream" in body &&
    typeof body.transformToWebStream === "function"
  ) {
    return body.transformToWebStream() as ReadableStream;
  }

  return null;
}

function getSafeRange(request: Request) {
  const range = request.headers.get("range");

  if (!range) {
    return null;
  }

  return RANGE_PATTERN.test(range) ? range : null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const storageKey = key.join("/");

  try {
    validateUploadStorageKey(storageKey);

    const object = await getMediaObject({
      range: getSafeRange(request),
      storageKey,
    });
    const stream = streamFromBody(object.Body);

    if (!stream) {
      return new NextResponse("Media stream unavailable.", { status: 502 });
    }

    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": object.ContentType ?? "application/octet-stream",
    });

    if (typeof object.ContentLength === "number") {
      headers.set("Content-Length", String(object.ContentLength));
    }

    if (object.ContentRange) {
      headers.set("Content-Range", object.ContentRange);
    }

    return new NextResponse(stream, {
      headers,
      status: object.ContentRange ? 206 : 200,
    });
  } catch {
    return new NextResponse("Media not found.", { status: 404 });
  }
}

export async function HEAD(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const storageKey = key.join("/");

  try {
    validateUploadStorageKey(storageKey);
    const object = await headMediaObject(storageKey);

    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": object.ContentType ?? "application/octet-stream",
    });

    if (typeof object.ContentLength === "number") {
      headers.set("Content-Length", String(object.ContentLength));
    }

    return new NextResponse(null, { headers, status: 200 });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
