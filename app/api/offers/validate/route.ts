import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "No code provided." }, { status: 400 });

  try {
    const offer = await prisma.offer.findUnique({ where: { code } });
    if (!offer) return NextResponse.json({ valid: false, error: "Code not found." }, { status: 404 });
    if (new Date() > offer.expiresAt) return NextResponse.json({ valid: false, error: "This code has expired." }, { status: 410 });

    const percent = offer.isPercent ? offer.discount : 0;
    const amount  = offer.isPercent ? 0 : offer.discount;
    const label   = offer.isPercent ? `${offer.discount}% off` : `${offer.discount.toFixed(2)} off`;

    return NextResponse.json({ valid: true, code, percent, amount, label });
  } catch (err) {
    console.error("[GET /api/offers/validate]", err);
    return NextResponse.json({ error: "Failed to validate code." }, { status: 500 });
  }
}
