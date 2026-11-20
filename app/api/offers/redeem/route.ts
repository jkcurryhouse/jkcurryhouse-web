import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json();
    if (!userId || !code) {
      return NextResponse.json({ error: "userId and code required" }, { status: 400 });
    }

    const offer = await prisma.offer.findUnique({ where: { code: code.toUpperCase() } });
    if (!offer) return NextResponse.json({ error: "Offer not found." }, { status: 404 });

    if (!offer.isGeneral) {
      // Mark as redeemed for this user
      await prisma.userOffer.updateMany({
        where:  { userId, offerId: offer.id, redeemedAt: null },
        data:   { redeemedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/offers/redeem]", err);
    return NextResponse.json({ error: "Failed to redeem offer." }, { status: 500 });
  }
}
