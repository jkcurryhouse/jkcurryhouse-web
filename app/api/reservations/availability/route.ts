import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSlotsForDate } from "@/lib/reservations";

// GET /api/reservations/availability?date=2025-03-14
// Returns which time slots still have space on a given date.
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const allSlots = getSlotsForDate(date);
    const MAX_PER_SLOT = 3;

    // Count existing confirmed bookings per slot on this date
    const dateStart = new Date(`${date}T00:00:00`);
    const dateEnd   = new Date(`${date}T23:59:59`);

    const bookings = await prisma.reservation.groupBy({
      by: ["time"],
      where: {
        date: { gte: dateStart, lte: dateEnd },
        status: { not: "CANCELLED" },
      },
      _count: { time: true },
    });

    const bookedMap: Record<string, number> = {};
    for (const b of bookings) bookedMap[b.time] = b._count.time;

    const slots = allSlots.map((time) => ({
      time,
      available: (bookedMap[time] ?? 0) < MAX_PER_SLOT,
      remaining: MAX_PER_SLOT - (bookedMap[time] ?? 0),
    }));

    return NextResponse.json({ date, slots });
  } catch (err) {
    console.error("[GET /api/reservations/availability]", err);
    return NextResponse.json({ error: "Failed to check availability." }, { status: 500 });
  }
}
