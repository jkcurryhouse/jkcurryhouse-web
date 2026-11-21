import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";
import { getSettings } from "@/lib/settings";
import { dayToDate, restaurantToday } from "@/lib/booking";
import { liveOfferWhere } from "@/lib/offer-rules";

export const dynamic = "force-dynamic";

const PAID   = ["CONFIRMED", "PREPARING", "READY", "DELIVERED"] as const;
const ACTIVE = ["CONFIRMED", "PREPARING", "READY"] as const;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const todayKey   = restaurantToday();
    const weekAgo    = new Date(startOfDay.getTime() - 6 * 86400000);

    const [
      todayOrders, activeOrders, revenueToday, revenueWeek,
      todaysBookings, pendingBookings, upcomingBookings,
      liveOffers, menuAvailable, menuHidden, specials, settings, activity,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfDay }, status: { in: [...PAID] } } }),
      prisma.order.count({ where: { status: { in: [...ACTIVE] } } }),
      prisma.order.aggregate({ where: { status: { in: [...PAID] }, createdAt: { gte: startOfDay } }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { status: { in: [...PAID] }, createdAt: { gte: weekAgo } }, _sum: { total: true } }),
      prisma.reservation.findMany({
        where:   { date: dayToDate(todayKey), status: { notIn: ["CANCELLED"] } },
        orderBy: { time: "asc" },
        select:  { id: true, name: true, time: true, partySize: true, status: true, tableNumber: true, specialRequest: true },
      }),
      prisma.reservation.count({ where: { status: "PENDING", date: { gte: dayToDate(todayKey) } } }),
      prisma.reservation.count({ where: { date: { gte: dayToDate(todayKey) }, status: { in: ["PENDING", "CONFIRMED"] } } }),
      prisma.offer.count({ where: liveOfferWhere() }),
      prisma.menuItem.count({ where: { isAvailable: true } }),
      prisma.menuItem.count({ where: { isAvailable: false } }),
      prisma.menuItem.findMany({ where: { isAvailable: true, OR: [{ isSpecial: true }, { category: "SPECIAL" }] }, select: { id: true, name: true } }),
      getSettings(),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ]);

    return NextResponse.json({
      orders:       { today: todayOrders, active: activeOrders },
      revenue:      { today: revenueToday._sum.total ?? 0, week: revenueWeek._sum.total ?? 0 },
      reservations: {
        today: todaysBookings.length,
        coversToday: todaysBookings.filter((b) => b.status !== "NO_SHOW").reduce((s, b) => s + b.partySize, 0),
        pending: pendingBookings, upcoming: upcomingBookings, todaysList: todaysBookings,
      },
      offers:   { live: liveOffers },
      menu:     { available: menuAvailable, hidden: menuHidden, specials },
      switches: {
        acceptingOrders: settings.acceptingOrders,
        acceptingReservations: settings.acceptingReservations,
        deliveryEnabled: settings.deliveryEnabled,
      },
      activity,
    });
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}
