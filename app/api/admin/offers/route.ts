import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin, audit } from "@/lib/server-auth";
import { offerCreate, zodMessage } from "@/lib/validators";

export const dynamic = "force-dynamic";

// GET /api/admin/offers — every offer (live, scheduled, paused, expired) with usage counts
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  try {
    const offers = await prisma.offer.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { UserOffers: true } } },
    });
    return NextResponse.json({ offers });
  } catch (err) {
    console.error("[GET /api/admin/offers]", err);
    return NextResponse.json({ error: "Failed to load offers." }, { status: 500 });
  }
}

// POST /api/admin/offers — create
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const parsed = offerCreate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  try {
    const offer = await prisma.offer.create({ data: parsed.data });
    await audit(auth.identity, "create", "offer", offer.id,
      `Created ${offer.isGeneral ? "general" : "personalised"} offer ${offer.code} (${offer.isPercent ? `${offer.discount}%` : `£${offer.discount.toFixed(2)}`} off)`);
    return NextResponse.json({ ok: true, offer }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "That code is already in use." }, { status: 409 });
    }
    console.error("[POST /api/admin/offers]", err);
    return NextResponse.json({ error: "Failed to create offer." }, { status: 500 });
  }
}
