import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  verifySessionCookieValue,
} from "@/lib/auth/session";
import { createSignedPutUpload } from "@/lib/storage/s3";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = await verifySessionCookieValue(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (!session) {
    return NextResponse.json({ error: "Admin session required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      fileName?: unknown;
      mimeType?: unknown;
      size?: unknown;
    };

    if (
      typeof body.fileName !== "string" ||
      typeof body.mimeType !== "string" ||
      typeof body.size !== "number"
    ) {
      return NextResponse.json(
        { error: "File name, MIME type, and size are required." },
        { status: 400 },
      );
    }

    if (body.mimeType.startsWith("video/")) {
      return NextResponse.json(
        { error: "Videos must be optimized by the server before upload." },
        { status: 400 },
      );
    }

    const signedUpload = await createSignedPutUpload({
      fileName: body.fileName,
      mimeType: body.mimeType,
      sizeBytes: body.size,
    });

    return NextResponse.json(signedUpload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Upload could not be signed.",
      },
      { status: 400 },
    );
  }
}
