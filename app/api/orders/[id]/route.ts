import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/orders/[id] — confirmation screen after payment (order id acts as the secret)
// Status changes are admin-only: /api/admin/orders/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({
      order: {
        orderId:    order.id,
        ref:        order.id.slice(-8).toUpperCase(),
        mode:       order.type.toLowerCase() as "delivery" | "takeaway",
        items:      order.items.map((i) => ({ name: i.name || "Item", quantity: i.quantity, price: i.price })),
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
