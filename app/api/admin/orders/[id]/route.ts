import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, audit } from "@/lib/server-auth";
import { orderStatusUpdate, zodMessage } from "@/lib/validators";
import { stripe } from "@/lib/orders";

// PATCH /api/admin/orders/[id] { status }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const parsed = orderStatusUpdate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  try {
    const before = await prisma.order.findUnique({ where: { id: params.id } });
    if (!before) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    // Optional full refund when cancelling a paid order
    let refunded = false;
    if (parsed.data.status === "CANCELLED" && parsed.data.refund) {
      if (before.status === "PENDING" || !before.stripePaymentIntentId) {
        return NextResponse.json({ error: "This order was never paid, so there is nothing to refund." }, { status: 409 });
      }
      try {
        await stripe.refunds.create(
          { payment_intent: before.stripePaymentIntentId },
          { idempotencyKey: `refund-${before.id}` },
        );
        refunded = true;
      } catch (err) {
        console.error("[refund]", err);
        return NextResponse.json({ error: "Stripe refund failed — the order was not cancelled. Try again or refund from the Stripe dashboard." }, { status: 502 });
      }
    }

    const order = await prisma.order.update({ where: { id: before.id }, data: { status: parsed.data.status } });
    await audit(auth.identity, "update", "order", order.id,
      `Order #${order.id.slice(-8).toUpperCase()}: ${before.status} → ${order.status}${refunded ? ` (refunded £${order.total.toFixed(2)})` : ""}`);
    return NextResponse.json({ ok: true, order, refunded });
  } catch (err) {
    console.error("[PATCH /api/admin/orders/[id]]", err);
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
