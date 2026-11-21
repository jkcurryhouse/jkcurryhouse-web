import { NextResponse, type NextRequest } from "next/server";
import { getIdentity } from "@/lib/server-auth";
import { checkOfferForOrder } from "@/lib/offer-rules";

export const dynamic = "force-dynamic";

// GET /api/offers/validate?code=WELCOME10&subtotal=32.50
export async function GET(req: NextRequest) {
  const code     = req.nextUrl.searchParams.get("code")?.trim();
  const subtotal = Number(req.nextUrl.searchParams.get("subtotal") ?? 0) || 0;
  if (!code) return NextResponse.json({ valid: false, error: "No code provided." }, { status: 400 });

  try {
    const me     = await getIdentity(req);
    const result = await checkOfferForOrder(code, subtotal, me?.sub ?? null);
    if (!result.ok) return NextResponse.json({ valid: false, error: result.error }, { status: result.status });

    const o = result.offer;
    return NextResponse.json({
      valid:   true,
      code:    o.code,
      percent: o.isPercent ? o.discount : 0,
      amount:  o.isPercent ? 0 : o.discount,
      label:   o.isPercent ? `${o.discount}% off` : `£${o.discount.toFixed(2)} off`,
    });
  } catch (err) {
    console.error("[GET /api/offers/validate]", err);
    return NextResponse.json({ valid: false, error: "Failed to validate code." }, { status: 500 });
  }
}
