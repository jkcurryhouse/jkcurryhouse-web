import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, audit } from "@/lib/server-auth";
import { menuItemCreate, zodMessage } from "@/lib/validators";
import { revalidatePublicMenu } from "@/lib/menu-repo";

export const dynamic = "force-dynamic";

// GET /api/admin/menu — every dish, including hidden ones
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { OrderItems: true } } },
    });
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/admin/menu]", err);
    return NextResponse.json({ error: "Failed to load menu." }, { status: 500 });
  }
}

// POST /api/admin/menu — add a dish
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const parsed = menuItemCreate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  try {
    const item = await prisma.menuItem.create({ data: parsed.data });
    await audit(auth.identity, "create", "menu", item.id, `Added dish "${item.name}" (£${item.price.toFixed(2)})`);
    revalidatePublicMenu();
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/menu]", err);
    return NextResponse.json({ error: "Failed to create item." }, { status: 500 });
  }
}
