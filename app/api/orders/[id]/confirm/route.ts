import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendOrderConfirmation, sendOrderNotification } from "@/lib/email";
import { markOrderPaid, stripe } from "@/lib/orders";

const schema = z.object({
  name:  z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().max(20).optional().default(""),
});

// POST /api/orders/[id]/confirm — called by the browser after Stripe reports success.
// Verifies the payment with Stripe before confirming; safe to call more than once.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  const { name, email, phone } = parsed.data;

  try {
    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order || !order.stripePaymentIntentId) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (pi.status !== "succeeded" || pi.amount !== Math.round(order.total * 100)) {
      return NextResponse.json({ error: "Payment has not completed." }, { status: 402 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data:  { customerName: name, customerPhone: phone || null, guestEmail: email },
    });
    await markOrderPaid(order.id); // no-op if the webhook got there first

    // Send emails once
    const claimed = await prisma.order.updateMany({
      where: { id: order.id, confirmationSentAt: null },
      data:  { confirmationSentAt: new Date() },
    });
    if (claimed.count === 1) {
      const full  = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
      const ref   = full.id.slice(-8).toUpperCase();
      const mode  = full.type === "DELIVERY" ? "delivery" : "takeaway";
      const eta   = mode === "delivery" ? "40–55 minutes" : "20–30 minutes";
      const items = full.items.map((i) => ({ name: i.name || "Item", quantity: i.quantity, price: i.price }));
      await Promise.allSettled([
        sendOrderConfirmation({ to: email, name, ref, mode, eta, items, total: full.total, address: full.address ?? undefined }),
        sendOrderNotification({ name, email, phone, ref, mode, items, total: full.total, address: full.address ?? undefined }),
      ]);
    }

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (err) {
    console.error("[POST /api/orders/[id]/confirm]", err);
    return NextResponse.json({ error: "Failed to confirm order." }, { status: 500 });
  }
}
