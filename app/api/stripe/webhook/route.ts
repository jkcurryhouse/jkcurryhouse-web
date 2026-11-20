import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-06-24.dahlia",
});

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    console.error("[Stripe webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    try {
      const amountPounds = pi.amount / 100;
      await prisma.order.updateMany({
        where: {
          status: "PENDING",
          total:  amountPounds,
          createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
        data: { status: "CONFIRMED" },
      });
    } catch (err) {
      console.error("[Stripe webhook] DB update failed:", err);
    }
  }

  return NextResponse.json({ received: true });
}
