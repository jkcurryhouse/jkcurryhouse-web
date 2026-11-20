import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { sendOrderConfirmation, sendOrderNotification } from "@/lib/email";
import { formatPrice } from "@/lib/utils";

// GET /api/orders/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        orderId:    order.id,
        ref:        order.id.slice(-8).toUpperCase(),
        mode:       order.type.toLowerCase() as "delivery" | "takeaway",
        items:      order.items.map((i: { menuItemId: string; quantity: number; price: number; id: string; orderId: string }) => ({
          name:     i.menuItemId, // replaced by real name in confirm step
          quantity: i.quantity,
          price:    i.price,
        })),
        total:      order.total,
        status:     order.status,
        guestEmail: order.guestEmail ?? "",
        address:    order.address ?? "",
      },
    });
  } catch (err) {
    console.error("[GET /api/orders/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch order." }, { status: 500 });
  }
}

// PATCH /api/orders/[id] — update status (admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    const validStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    console.error("[PATCH /api/orders/[id]]", err);
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
