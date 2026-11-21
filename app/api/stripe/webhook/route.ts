import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { markOrderPaid, stripe } from "@/lib/orders";

// POST /api/stripe/webhook — backstop if the customer closes the browser before /confirm runs
export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (err) {
    console.error("[Stripe webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi    = event.data.object as Stripe.PaymentIntent;
      const order = await prisma.order.findUnique({ where: { stripePaymentIntentId: pi.id } });
      if (order && pi.amount === Math.round(order.total * 100)) await markOrderPaid(order.id);
    }
    if (event.type === "payment_intent.canceled") {
      const pi = event.data.object as Stripe.PaymentIntent;
      await prisma.order.updateMany({
        where: { stripePaymentIntentId: pi.id, status: "PENDING" },
        data:  { status: "CANCELLED" },
      });
    }
  } catch (err) {
    console.error("[Stripe webhook] DB update failed:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 }); // Stripe retries
  }

  return NextResponse.json({ received: true });
}
