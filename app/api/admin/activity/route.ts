import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

// GET /api/admin/activity?take=50 — admin audit trail, newest first
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const take = Math.min(200, Number(req.nextUrl.searchParams.get("take") ?? 50) || 50);
  try {
    const entries = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take });
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("[GET /api/admin/activity]", err);
    return NextResponse.json({ error: "Failed to load activity." }, { status: 500 });
  }
}
