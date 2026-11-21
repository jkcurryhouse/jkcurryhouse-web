import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, audit } from "@/lib/server-auth";
import { adminReservationUpdate, zodMessage } from "@/lib/validators";
import { checkCapacity, dayToDate, dateToDay } from "@/lib/booking";
import { sendReservationCancelled, sendReservationConfirmation } from "@/lib/email";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/reservations";

type Ctx = { params: { id: string } };

// PATCH /api/admin/reservations/[id] — change status, move, assign table, add notes
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const parsed = adminReservationUpdate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
  const { notifyGuest, overrideCapacity, date, ...rest } = parsed.data;

  try {
    const before = await prisma.reservation.findUnique({ where: { id: params.id } });
    if (!before) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const newDay   = date ?? dateToDay(before.date);
    const newTime  = rest.time ?? before.time;
    const newParty = rest.partySize ?? before.partySize;
    const moved    = newDay !== dateToDay(before.date) || newTime !== before.time || newParty > before.partySize;

    if (moved && !overrideCapacity && (rest.status ?? before.status) !== "CANCELLED") {
      const cap = await checkCapacity(newDay, newTime, newParty, before.id);
      if (!cap.ok) return NextResponse.json({ error: cap.reason, canOverride: true }, { status: cap.status });
    }

    const r = await prisma.reservation.update({
      where: { id: before.id },
      data:  { ...rest, ...(date ? { date: dayToDate(date) } : {}) },
    });

    let emailed = false;
    if (notifyGuest && r.email) {
      const args = { to: r.email, name: r.name, date: formatDateDisplay(newDay),
                     time: formatTimeDisplay(newTime), reservationId: r.id };
      const res = r.status === "CANCELLED"
        ? await sendReservationCancelled(args)
        : await sendReservationConfirmation({ ...args, partySize: r.partySize,
            specialRequest: r.specialRequest ?? undefined });
      emailed = res.ok;
    }

    const changes = [
      rest.status && rest.status !== before.status ? `status ${before.status} → ${rest.status}` : null,
      moved ? `moved to ${newDay} ${newTime} × ${newParty}` : null,
      rest.tableNumber !== undefined ? `table ${rest.tableNumber || "cleared"}` : null,
      rest.adminNotes  !== undefined ? "notes updated" : null,
    ].filter(Boolean).join("; ") || "details edited";
    await audit(auth.identity, "update", "reservation", r.id, `${r.name}: ${changes}`);

    return NextResponse.json({ ok: true, reservation: r, emailed });
  } catch (err) {
    console.error("[PATCH /api/admin/reservations/[id]]", err);
    return NextResponse.json({ error: "Failed to update booking." }, { status: 500 });
  }
}
