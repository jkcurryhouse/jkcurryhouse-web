import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin, audit } from "@/lib/server-auth";
import { offerUpdate, zodMessage } from "@/lib/validators";

type Ctx = { params: { id: string } };

// PATCH /api/admin/offers/[id] — edit, pause/resume
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const parsed = offerUpdate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  try {
    const current = await prisma.offer.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    const merged = { ...current, ...parsed.data };
    if (merged.isPercent && merged.discount > 100) {
      return NextResponse.json({ error: "A percentage discount can't exceed 100%." }, { status: 400 });
    }
    if (merged.startsAt >= merged.expiresAt) {
      return NextResponse.json({ error: "Expiry must be after the start date." }, { status: 400 });
    }
    const offer = await prisma.offer.update({ where: { id: params.id }, data: parsed.data });
    const keys  = Object.keys(parsed.data);
    const what  = keys.length === 1 && keys[0] === "isActive"
      ? (offer.isActive ? "resumed" : "paused")
      : `edited ${keys.join(", ")}`;
    await audit(auth.identity, "update", "offer", offer.id, `${offer.code}: ${what}`);
    return NextResponse.json({ ok: true, offer });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") return NextResponse.json({ error: "That code is already in use." }, { status: 409 });
      if (err.code === "P2025") return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    }
    console.error("[PATCH /api/admin/offers/[id]]", err);
    return NextResponse.json({ error: "Failed to update offer." }, { status: 500 });
  }
}

// DELETE /api/admin/offers/[id]
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  try {
    const offer = await prisma.offer.delete({ where: { id: params.id } }); // UserOffers cascade
    await audit(auth.identity, "delete", "offer", offer.id, `Deleted offer ${offer.code}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    }
    console.error("[DELETE /api/admin/offers/[id]]", err);
    return NextResponse.json({ error: "Failed to delete offer." }, { status: 500 });
  }
}
