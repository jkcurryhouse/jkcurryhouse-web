import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/menu — all menu items (optionally filter by category/available)
export async function GET(req: NextRequest) {
  const category  = req.nextUrl.searchParams.get("category");
  const available = req.nextUrl.searchParams.get("available");

  try {
    const where: Record<string, unknown> = {};
    if (category)          where.category    = category.toUpperCase();
    if (available === "1") where.isAvailable = true;

    const items = await prisma.menuItem.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/menu]", err);
    return NextResponse.json({ error: "Failed to load menu." }, { status: 500 });
  }
}

// POST /api/menu — create menu item (admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = await prisma.menuItem.create({ data: body });
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    console.error("[POST /api/menu]", err);
    return NextResponse.json({ error: "Failed to create item." }, { status: 500 });
  }
}
