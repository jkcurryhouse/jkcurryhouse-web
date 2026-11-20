import { NextResponse, type NextRequest } from "next/server";
import { getUploadUrl, getPublicUrl } from "@/lib/s3";
import { randomUUID } from "crypto";

// POST /api/menu/upload — returns a pre-signed S3 URL for direct browser upload
export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
    }

    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const key = `menu/${randomUUID()}.${ext}`;

    const uploadUrl = await getUploadUrl(key, contentType);
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (err) {
    console.error("[POST /api/menu/upload]", err);
    return NextResponse.json({ error: "Failed to generate upload URL." }, { status: 500 });
  }
}
