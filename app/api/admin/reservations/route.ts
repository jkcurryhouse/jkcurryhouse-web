import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin, audit } from "@/lib/server-auth";
import { adminReservationCreate, zodMessage } from "@/lib/validators";
import { checkCapacity, dayToDate } from "@/lib/booking";
import { sendReservationConfirmation } from "@/lib/email";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/reservations";

export const dynamic = "force-dynamic";

// GET /api/admin/reservations?from=YYYY-MM-DD&to=YYYY-MM-DD&status=CONFIRMED&q=smith
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const sp     = req.nextUrl.searchParams;
  const from   = sp.get("from") ?? sp.get("date");
  const to     = sp.get("to")   ?? sp.get("date");
  const status = sp.get("status");
  const q      = sp.get("q")?.trim();

  const where: Prisma.ReservationWhereInput = {};
  if (from || to) {
    where.date = {
      ...(from ? { gte: dayToDate(from) } : {}),
      ...(to   ? { lte: dayToDate(to) }   : {}),
    };
  }
  if (status) where.status = status as Prisma.EnumReservationStatusFilter["equals"];
  if (q) {
    where.OR = [
      { name:  { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { id:    { endsWith: q.toLowerCase() } },
    ];
  }

  try {
    const reservations = await prisma.reservation.findMany({
      where, orderBy: [{ date: "asc" }, { time: "asc" }], take: 500,
    });
    return NextResponse.json({ reservations });
  } catch (err) {
    console.error("[GET /api/admin/reservations]", err);
    return NextResponse.json({ error: "Failed to fetch reservations." }, { status: 500 });
  }
}

// POST /api/admin/reservations — staff take a booking (phone / walk-in)
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const parsed = adminReservationCreate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
  const d = parsed.data;

  try {
    if (!d.overrideCapacity) {
      const cap = await checkCapacity(d.date, d.time, d.partySize);
      if (!cap.ok) {
        return NextResponse.json({ error: cap.reason, canOverride: true }, { status: cap.status });
      }
    }

    const r = await prisma.reservation.create({
      data: {
        name: d.name, email: d.email, phone: d.phone,
        date: dayToDate(d.date), time: d.time, partySize: d.partySize,
        specialRequest: d.specialRequest || null,
        status: d.status, source: d.source,
        tableNumber: d.tableNumber || null, adminNotes: d.adminNotes || null,
      },
    });

    let emailed = false;
    if (d.sendEmail && d.email) {
      const res = await sendReservationConfirmation({
        to: d.email, name: d.name, date: formatDateDisplay(d.date), time: formatTimeDisplay(d.time),
        partySize: d.partySize, reservationId: r.id, specialRequest: d.specialRequest,
      });
      emailed = res.ok;
    }

    await audit(auth.identity, "create", "reservation", r.id,
      `Booked ${d.name} × ${d.partySize} on ${d.date} ${d.time} (${d.source.toLowerCase().replace("_", "-")})${d.overrideCapacity ? " — capacity overridden" : ""}`);
    return NextResponse.json({ ok: true, reservation: r, emailed }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/reservations]", err);
    return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
  }
}
