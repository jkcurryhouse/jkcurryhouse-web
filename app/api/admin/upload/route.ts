import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/server-auth";
import { getUploadUrl, getPublicUrl } from "@/lib/s3";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
};
const MAX_BYTES = 5 * 1024 * 1024;

// POST /api/admin/upload — pre-signed S3 URL so the browser uploads the dish photo directly
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  try {
    const { contentType, size } = (await req.json()) as { contentType?: string; size?: number };
    const ext = contentType ? TYPES[contentType] : undefined;
    if (!ext) return NextResponse.json({ error: "Use a JPG, PNG, WebP or AVIF image." }, { status: 400 });
    if (typeof size === "number" && size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 400 });
    }
    const key = `menu/${randomUUID()}.${ext}`;
    return NextResponse.json({ uploadUrl: await getUploadUrl(key, contentType!), publicUrl: getPublicUrl(key), key });
  } catch (err) {
    console.error("[POST /api/admin/upload]", err);
    return NextResponse.json({ error: "Failed to generate upload URL. Check S3 settings." }, { status: 500 });
  }
}
