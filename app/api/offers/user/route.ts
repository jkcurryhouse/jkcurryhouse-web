import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getIdentity } from "@/lib/server-auth";
import { userMeetsOfferCriteria } from "@/lib/offers";
import { getUserStats, isOfferLive, liveOfferWhere } from "@/lib/offer-rules";

export const dynamic = "force-dynamic";

// GET /api/offers/user — signed-in customer's stats + personalised offers.
// Also unlocks any personalised offers they now qualify for.
export async function GET(req: NextRequest) {
  const me = await getIdentity(req);
  if (!me) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userId = me.sub;

  try {
    const stats = await getUserStats(userId);

    const existing = (await prisma.userOffer.findMany({ where: { userId }, select: { offerId: true } }))
      .map((uo) => uo.offerId);
    const candidates = await prisma.offer.findMany({
      where: { isGeneral: false, ...liveOfferWhere(), id: { notIn: existing } },
    });
    const toAssign = candidates.filter((o) => isOfferLive(o) && userMeetsOfferCriteria(o, stats));
    if (toAssign.length) {
      await prisma.userOffer.createMany({
        data: toAssign.map((o) => ({ userId, offerId: o.id, email: me.email || null })),
        skipDuplicates: true,
      });
    }

    const userOffers = await prisma.userOffer.findMany({
      where: { userId, redeemedAt: null }, include: { offer: true },
    });
    return NextResponse.json({ stats, offers: userOffers.map((uo) => uo.offer).filter((o) => !o.isGeneral && isOfferLive(o)) });
  } catch (err) {
    console.error("[GET /api/offers/user]", err);
    return NextResponse.json({ error: "Failed to load user offers." }, { status: 500 });
  }
}
