import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-06-24.dahlia",
});

const itemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
});

const schema = z.object({
  mode:            z.enum(["delivery", "takeaway"]),
  items:           z.array(itemSchema).min(1),
  subtotal:        z.number().nonnegative(),
  deliveryFee:     z.number().nonnegative(),
  discount:        z.number().nonnegative().default(0),
  discountCode:    z.string().optional(),
  total:           z.number().positive(),
  deliveryAddress: z.string().optional(),
  guestEmail:      z.string().email().optional(),
  userId:          z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { mode, items, total, deliveryAddress, guestEmail, userId } = parsed.data;

    // Delivery radius check — SN15 postcodes only
    if (mode === "delivery" && deliveryAddress) {
      const postcode = deliveryAddress.toUpperCase().replace(/\s+/g, "");
      if (!postcode.startsWith("SN15") && !postcode.startsWith("SN14")) {
        return NextResponse.json(
          { error: "Sorry, we only deliver within the SN15 postcode area." },
          { status: 422 }
        );
      }
    }

    // Create Stripe PaymentIntent
    const amountPence = Math.round(total * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountPence,
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      metadata: {
        restaurant: "jk-curryhouse-chippenham",
        mode,
        itemCount: String(items.length),
      },
    });

    // Create order in DB (status PENDING until payment confirms)
    const order = await prisma.order.create({
      data: {
        type:    mode === "delivery" ? "DELIVERY" : "TAKEAWAY",
        status:  "PENDING",
        total,
        userId:  userId ?? null,
        guestEmail: guestEmail ?? null,
        address: deliveryAddress ?? null,
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity:   item.quantity,
            price:      item.price,
          })),
        },
      },
    });

    return NextResponse.json({
      orderId:      order.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json(
      { error: "Could not create order. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status  = searchParams.get("status");
  const userId  = searchParams.get("userId");
  const type    = searchParams.get("type");

  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (type)   where.type   = type;

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[GET /api/orders]", err);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
