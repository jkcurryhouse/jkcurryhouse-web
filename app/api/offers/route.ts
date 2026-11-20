import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const now    = new Date();

  try {
    // General offers visible to everyone
    const general = await prisma.offer.findMany({
      where: { isGeneral: true, expiresAt: { gt: now } },
      orderBy: { expiresAt: "asc" },
    });

    // Personalised offers for this user (if logged in)
    let personal: typeof general = [];
    if (userId) {
      const userOffers = await prisma.userOffer.findMany({
        where:   { userId, redeemedAt: null },
        include: { offer: true },
      });
      personal = userOffers
        .filter((uo: { offer: { expiresAt: Date } }) => new Date(uo.offer.expiresAt) > now)
        .map((uo: { offer: typeof general[number] }) => uo.offer);
    }

    return NextResponse.json({ general, personal });
  } catch (err) {
    console.error("[GET /api/offers]", err);
    return NextResponse.json({ error: "Failed to load offers." }, { status: 500 });
  }
}

// POST /api/offers — admin: create an offer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const offer = await prisma.offer.create({ data: body });
    return NextResponse.json({ ok: true, offer });
  } catch (err) {
    console.error("[POST /api/offers]", err);
    return NextResponse.json({ error: "Failed to create offer." }, { status: 500 });
  }
}
