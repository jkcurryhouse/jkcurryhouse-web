import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { sendOrderConfirmation, sendOrderNotification } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, email, phone } = await req.json();

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: "CONFIRMED",
        guestEmail: email,
      },
      include: { items: true },
    });

    const ref = order.id.slice(-8).toUpperCase();
    const mode = order.type === "DELIVERY" ? "delivery" : "takeaway";
    const eta  = mode === "delivery" ? "40–55 minutes" : "20–30 minutes";

    // Send emails (non-blocking)
    await Promise.allSettled([
      sendOrderConfirmation({
        to: email, name, ref, mode, eta,
        items: order.items.map((i: { menuItemId: string; quantity: number; price: number }) => ({
          name: i.menuItemId, quantity: i.quantity, price: i.price,
        })),
        total: order.total,
        address: order.address ?? undefined,
      }),
      sendOrderNotification({
        name, email, phone, ref, mode,
        items: order.items.map((i: { menuItemId: string; quantity: number; price: number }) => ({
          name: i.menuItemId, quantity: i.quantity, price: i.price,
        })),
        total: order.total,
        address: order.address ?? undefined,
      }),
    ]);

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (err) {
    console.error("[POST /api/orders/[id]/confirm]", err);
    return NextResponse.json({ error: "Failed to confirm order." }, { status: 500 });
  }
}
