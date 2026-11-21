import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, audit } from "@/lib/server-auth";
import { menuItemUpdate, zodMessage } from "@/lib/validators";
import { revalidatePublicMenu } from "@/lib/menu-repo";
import { deleteObject, keyFromUrl } from "@/lib/s3";

type Ctx = { params: { id: string } };

function describeChange(before: Record<string, unknown>, data: Record<string, unknown>) {
  const parts: string[] = [];
  if ("isAvailable" in data) parts.push(data.isAvailable ? "shown on menu" : "hidden from menu");
  if ("isSpecial" in data)   parts.push(data.isSpecial ? "set as Today's Special" : "removed from Today's Special");
  if ("price" in data && data.price !== before.price) parts.push(`price £${Number(before.price).toFixed(2)} → £${Number(data.price).toFixed(2)}`);
  const other = Object.keys(data).filter((k) => !["isAvailable","isSpecial","price"].includes(k));
  if (other.length) parts.push(`edited ${other.join(", ")}`);
  return parts.join("; ") || "updated";
}

// PATCH /api/admin/menu/[id]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const parsed = menuItemUpdate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  try {
    const before = await prisma.menuItem.findUnique({ where: { id: params.id } });
    if (!before) return NextResponse.json({ error: "Dish not found." }, { status: 404 });

    const item = await prisma.menuItem.update({ where: { id: params.id }, data: parsed.data });

    // Image replaced or removed → tidy up the old S3 object
    if (before.imageUrl && "imageUrl" in parsed.data && parsed.data.imageUrl !== before.imageUrl) {
      deleteObject(keyFromUrl(before.imageUrl)).catch(() => {});
    }

    await audit(auth.identity, "update", "menu", item.id, `"${item.name}": ${describeChange(before, parsed.data)}`);
    revalidatePublicMenu();
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    console.error("[PATCH /api/admin/menu/[id]]", err);
    return NextResponse.json({ error: "Failed to update item." }, { status: 500 });
  }
}

// DELETE /api/admin/menu/[id]
// Dishes that appear in past orders can't be deleted (order history must stay intact),
// so those are hidden instead and the response says so.
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: params.id },
      include: { _count: { select: { OrderItems: true } } },
    });
    if (!item) return NextResponse.json({ error: "Dish not found." }, { status: 404 });

    if (item._count.OrderItems > 0) {
      await prisma.menuItem.update({ where: { id: item.id }, data: { isAvailable: false, isSpecial: false } });
      await audit(auth.identity, "archive", "menu", item.id, `Hid "${item.name}" (has order history, kept for records)`);
      revalidatePublicMenu();
      return NextResponse.json({ ok: true, archived: true,
        message: `"${item.name}" appears in past orders, so it was hidden from the menu instead of deleted.` });
    }

    await prisma.menuItem.delete({ where: { id: item.id } });
    if (item.imageUrl) deleteObject(keyFromUrl(item.imageUrl)).catch(() => {});
    await audit(auth.identity, "delete", "menu", item.id, `Deleted dish "${item.name}"`);
    revalidatePublicMenu();
    return NextResponse.json({ ok: true, archived: false });
  } catch (err) {
    console.error("[DELETE /api/admin/menu/[id]]", err);
    return NextResponse.json({ error: "Failed to delete item." }, { status: 500 });
  }
}
