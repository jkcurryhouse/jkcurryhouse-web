import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getIdentity } from "@/lib/server-auth";
import { quoteOrder, stripe } from "@/lib/orders";

const schema = z.object({
  mode:            z.enum(["delivery", "takeaway"]),
  items:           z.array(z.object({
    menuItemId: z.string().min(1),
    quantity:   z.number().int().min(1).max(50),
  })).min(1).max(60),
  discountCode:    z.string().max(40).optional(),
  deliveryAddress: z.string().max(300).optional(),
  guestEmail:      z.string().email().optional(),
  expectedTotal:   z.number().nonnegative().optional(),
}).passthrough();

// POST /api/orders — price the basket on the server, create the order + Stripe PaymentIntent
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }
    const d  = parsed.data;
    const me = await getIdentity(req);

    const q = await quoteOrder({
      mode: d.mode, items: d.items, discountCode: d.discountCode,
      deliveryAddress: d.deliveryAddress, userId: me?.sub ?? null,
    });
    if (!q.ok) return NextResponse.json({ error: q.error }, { status: q.status });

    // Basket shown to the customer must match what they'll be charged
    if (d.expectedTotal != null && Math.abs(d.expectedTotal - q.total) > 0.009) {
      return NextResponse.json({
        error: `Prices have changed since you opened the menu — your total is now £${q.total.toFixed(2)}. Please review your basket.`,
        quote: { subtotal: q.subtotal, deliveryFee: q.deliveryFee, discount: q.discount, total: q.total },
      }, { status: 409 });
    }

    const order = await prisma.order.create({
      data: {
        type:         d.mode === "delivery" ? "DELIVERY" : "TAKEAWAY",
        status:       "PENDING",
        subtotal:     q.subtotal,
        deliveryFee:  q.deliveryFee,
        discount:     q.discount,
        discountCode: q.discountCode,
        total:        q.total,
        userId:       me?.sub ?? null,
        guestEmail:   d.guestEmail ?? me?.email ?? null,
        address:      d.mode === "delivery" ? d.deliveryAddress ?? null : null,
        items: { create: q.lines.map((l) => ({
          menuItemId: l.menuItemId, name: l.name, quantity: l.quantity, price: l.price,
        })) },
      },
    });

    const pi = await stripe.paymentIntents.create({
      amount:   Math.round(q.total * 100),
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      metadata: { restaurant: "jk-curryhouse-chippenham", orderId: order.id, mode: d.mode },
    });
    await prisma.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: pi.id } });

    return NextResponse.json({
      orderId: order.id, clientSecret: pi.client_secret,
      subtotal: q.subtotal, deliveryFee: q.deliveryFee, discount: q.discount, total: q.total,
    });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ error: "Could not create order. Please try again." }, { status: 500 });
  }
}

// GET /api/orders — the signed-in customer's own order history
export async function GET(req: NextRequest) {
  const me = await getIdentity(req);
  if (!me) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const orders = await prisma.order.findMany({
      where:   { userId: me.sub, status: { not: "PENDING" } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take:    50,
    });
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[GET /api/orders]", err);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
