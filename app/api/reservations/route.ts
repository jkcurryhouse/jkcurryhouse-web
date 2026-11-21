import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendReservationConfirmation, sendReservationNotification } from "@/lib/email";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/reservations";
import { checkCapacity, dayToDate, restaurantToday } from "@/lib/booking";
import { getSettings } from "@/lib/settings";

const schema = z.object({
  name:           z.string().min(2).max(100),
  email:          z.string().email(),
  phone:          z.string().min(7).max(20),
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time:           z.string().regex(/^\d{2}:\d{2}$/),
  partySize:      z.number().int().min(1).max(60),
  specialRequest: z.string().max(500).optional(),
});

// POST /api/reservations — public online booking.
// (Listing and managing bookings is admin-only, under /api/admin/reservations.)
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }
    const { name, email, phone, date, time, partySize, specialRequest } = parsed.data;

    const settings = await getSettings();
    if (!settings.acceptingReservations) {
      return NextResponse.json({ error: "Online booking is paused right now. Please call us on 01249 123456." }, { status: 503 });
    }
    if (partySize > settings.maxPartySize) {
      return NextResponse.json({ error: `For parties over ${settings.maxPartySize}, please call us to book.` }, { status: 422 });
    }
    if (date < restaurantToday()) {
      return NextResponse.json({ error: "Please choose a date in the future." }, { status: 422 });
    }

    const cap = await checkCapacity(date, time, partySize);
    if (!cap.ok) return NextResponse.json({ error: cap.reason }, { status: cap.status });

    const reservation = await prisma.reservation.create({
      data: {
        name, email, phone, date: dayToDate(date), time, partySize,
        specialRequest: specialRequest ?? null,
        status: "CONFIRMED",
        source: "ONLINE",
      },
    });

    const dateDisplay = formatDateDisplay(date);
    const timeDisplay = formatTimeDisplay(time);
    await Promise.allSettled([
      sendReservationConfirmation({ to: email, name, date: dateDisplay, time: timeDisplay,
        partySize, reservationId: reservation.id, specialRequest }),
      sendReservationNotification({ name, email, phone, date: dateDisplay, time: timeDisplay,
        partySize, reservationId: reservation.id, specialRequest }),
    ]);

    return NextResponse.json({
      ok: true,
      reservation: {
        id: reservation.id,
        ref: reservation.id.slice(-8).toUpperCase(),
        date: dateDisplay, time: timeDisplay, partySize,
        status: reservation.status,
      },
    });
  } catch (err) {
    console.error("[POST /api/reservations]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
