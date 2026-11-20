import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendReservationConfirmation, sendReservationNotification } from "@/lib/email";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/reservations";

const schema = z.object({
  name:           z.string().min(2).max(100),
  email:          z.string().email(),
  phone:          z.string().min(7).max(20),
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time:           z.string().regex(/^\d{2}:\d{2}$/),
  partySize:      z.number().int().min(1).max(20),
  specialRequest: z.string().max(500).optional(),
});

const MAX_PER_SLOT = 3;

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

    const { name, email, phone, date, time, partySize, specialRequest } = parsed.data;
    const dateObj = new Date(`${date}T${time}:00`);

    // Double-booking check
    const slotCount = await prisma.reservation.count({
      where: {
        date: dateObj,
        time,
        status: { not: "CANCELLED" },
      },
    });

    if (slotCount >= MAX_PER_SLOT) {
      return NextResponse.json(
        { error: "This time slot is fully booked. Please choose another time." },
        { status: 409 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        name, email, phone,
        date: dateObj, time, partySize,
        specialRequest: specialRequest ?? null,
        status: "CONFIRMED",
      },
    });

    const dateDisplay = formatDateDisplay(date);
    const timeDisplay = formatTimeDisplay(time);

    await Promise.allSettled([
      sendReservationConfirmation({
        to: email, name, date: dateDisplay, time: timeDisplay,
        partySize, reservationId: reservation.id, specialRequest,
      }),
      sendReservationNotification({
        name, email, phone, date: dateDisplay, time: timeDisplay,
        partySize, reservationId: reservation.id, specialRequest,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      reservation: {
        id: reservation.id,
        ref: reservation.id.slice(-8).toUpperCase(),
        date: dateDisplay,
        time: timeDisplay,
        partySize,
        status: reservation.status,
      },
    });
  } catch (err) {
    console.error("[POST /api/reservations]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  try {
    const where: Record<string, unknown> = {};
    if (date) where.date = new Date(date);
    if (status) where.status = status;

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return NextResponse.json({ reservations });
  } catch (err) {
    console.error("[GET /api/reservations]", err);
    return NextResponse.json({ error: "Failed to fetch reservations." }, { status: 500 });
  }
}
