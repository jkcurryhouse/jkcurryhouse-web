import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { userMeetsOfferCriteria } from "@/lib/offers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  try {
    // Get user's order stats
    const orders = await prisma.order.findMany({
      where: { userId, status: { in: ["CONFIRMED", "PREPARING", "READY", "DELIVERED"] } },
      select: { total: true },
    });
    const stats = {
      completedOrders: orders.length,
      totalSpend:      orders.reduce((s: number, o: { total: number }) => s + o.total, 0),
    };

    // Find all non-general offers user doesn't already have
    const existingOfferIds = (
      await prisma.userOffer.findMany({ where: { userId }, select: { offerId: true } })
    ).map((uo: { offerId: string }) => uo.offerId);

    const eligibleOffers = await prisma.offer.findMany({
      where: {
        isGeneral:  false,
        expiresAt:  { gt: new Date() },
        id:         { notIn: existingOfferIds },
      },
    });

    // Auto-assign offers the user has unlocked but hasn't been given yet
    const toAssign = (eligibleOffers as Array<{ id: string; minOrders: number; minSpend: number }>)
      .filter((o) => userMeetsOfferCriteria(o, stats));
    if (toAssign.length > 0) {
      await prisma.userOffer.createMany({
        data:           toAssign.map((o) => ({ userId, offerId: o.id })),
        skipDuplicates: true,
      });
    }

    // Return full list of this user's active offers
    const userOffers = await prisma.userOffer.findMany({
      where:   { userId, redeemedAt: null },
      include: { offer: true },
    });

    return NextResponse.json({ stats, offers: userOffers.map((uo: { offer: unknown }) => uo.offer) });
  } catch (err) {
    console.error("[GET /api/offers/user]", err);
    return NextResponse.json({ error: "Failed to load user offers." }, { status: 500 });
  }
}
