import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getIdentity } from "@/lib/server-auth";
import { isOfferLive, liveOfferWhere } from "@/lib/offer-rules";

export const dynamic = "force-dynamic";

// GET /api/offers — live general offers for everyone, plus the caller's own
// personalised offers when a valid sign-in token is sent.
export async function GET(req: NextRequest) {
  try {
    const general = await prisma.offer.findMany({
      where:   { isGeneral: true, ...liveOfferWhere() },
      orderBy: { expiresAt: "asc" },
    });

    let personal: typeof general = [];
    const me = await getIdentity(req);
    if (me) {
      const userOffers = await prisma.userOffer.findMany({
        where:   { userId: me.sub, redeemedAt: null },
        include: { offer: true },
      });
      personal = userOffers.map((uo) => uo.offer).filter((o) => !o.isGeneral && isOfferLive(o));
    }

    return NextResponse.json({
      general: general.filter((o) => isOfferLive(o)),
      personal,
    });
  } catch (err) {
    console.error("[GET /api/offers]", err);
    return NextResponse.json({ error: "Failed to load offers." }, { status: 500 });
  }
}
