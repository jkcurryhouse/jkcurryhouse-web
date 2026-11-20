import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { deleteObject, keyFromUrl } from "@/lib/s3";

// PATCH /api/menu/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    const item = await prisma.menuItem.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    console.error("[PATCH /api/menu/[id]]", err);
    return NextResponse.json({ error: "Failed to update item." }, { status: 500 });
  }
}

// DELETE /api/menu/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: params.id } });
    if (item?.imageUrl) {
      try { await deleteObject(keyFromUrl(item.imageUrl)); } catch { /* non-fatal */ }
    }
    await prisma.menuItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/menu/[id]]", err);
    return NextResponse.json({ error: "Failed to delete item." }, { status: 500 });
  }
}
