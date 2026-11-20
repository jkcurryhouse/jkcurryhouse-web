import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const offer = await prisma.offer.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, offer });
  } catch (err) {
    console.error("[PATCH /api/offers/[id]]", err);
    return NextResponse.json({ error: "Failed to update offer." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.userOffer.deleteMany({ where: { offerId: params.id } });
    await prisma.offer.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/offers/[id]]", err);
    return NextResponse.json({ error: "Failed to delete offer." }, { status: 500 });
  }
}
