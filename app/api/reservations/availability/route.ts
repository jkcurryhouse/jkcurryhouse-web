import { NextResponse, type NextRequest } from "next/server";
import { getSlotsForDate } from "@/lib/reservations";
import { getSlotUsage } from "@/lib/booking";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

// GET /api/reservations/availability?date=2025-03-14&party=4
export async function GET(req: NextRequest) {
  const date  = req.nextUrl.searchParams.get("date");
  const party = Math.max(1, Number(req.nextUrl.searchParams.get("party") ?? 1) || 1);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const s = await getSettings();
    if (!s.acceptingReservations || s.closedDates.includes(date)) {
      return NextResponse.json({
        date, slots: [], closed: true,
        reason: !s.acceptingReservations
          ? "Online booking is paused. Please call us on 01249 123456."
          : "We're closed on this date.",
      });
    }

    const usage = await getSlotUsage(date);
    const slots = getSlotsForDate(date).map((time) => {
      const u = usage[time] ?? { bookings: 0, covers: 0 };
      const remaining = Math.max(0, s.maxBookingsPerSlot - u.bookings);
      return {
        time,
        remaining,
        available: remaining > 0 && u.covers + party <= s.maxCoversPerSlot,
      };
    });
    return NextResponse.json({ date, slots, closed: false, maxPartySize: s.maxPartySize });
  } catch (err) {
    console.error("[GET /api/reservations/availability]", err);
    return NextResponse.json({ error: "Failed to check availability." }, { status: 500 });
  }
}
