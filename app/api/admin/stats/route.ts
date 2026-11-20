import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders, todayOrders, pendingOrders,
      totalReservations, todayReservations, pendingReservations,
      totalOffers, revenueResult, menuCount,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: { in: ["PENDING","CONFIRMED","PREPARING","READY"] } } }),
      prisma.reservation.count(),
      prisma.reservation.count({ where: { date: { gte: today } } }),
      prisma.reservation.count({ where: { status: "PENDING" } }),
      prisma.offer.count({ where: { expiresAt: { gt: new Date() } } }),
      prisma.order.aggregate({
        where: { status: { in: ["CONFIRMED","PREPARING","READY","DELIVERED"] }, createdAt: { gte: today } },
        _sum:  { total: true },
      }),
      prisma.menuItem.count({ where: { isAvailable: true } }),
    ]);

    return NextResponse.json({
      orders:       { total: totalOrders, today: todayOrders, active: pendingOrders },
      reservations: { total: totalReservations, today: todayReservations, pending: pendingReservations },
      offers:       { active: totalOffers },
      revenue:      { today: revenueResult._sum.total ?? 0 },
      menu:         { items: menuCount },
    });
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}
