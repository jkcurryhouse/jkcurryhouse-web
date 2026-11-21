import "server-only";
import prisma from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getSlotsForDate } from "@/lib/reservations";

/** Reservations store the calendar day as UTC midnight; the slot lives in `time`. */
export function dayToDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export function dateToDay(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "SEATED", "COMPLETED"] as const;

export interface SlotUsage { bookings: number; covers: number }

/** Bookings and covers per time slot for one day (cancelled / no-shows excluded). */
export async function getSlotUsage(day: string, excludeId?: string): Promise<Record<string, SlotUsage>> {
  const rows = await prisma.reservation.findMany({
    where: {
      date:   dayToDate(day),
      status: { in: [...ACTIVE_STATUSES] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { time: true, partySize: true },
  });
  const usage: Record<string, SlotUsage> = {};
  for (const r of rows) {
    usage[r.time] ??= { bookings: 0, covers: 0 };
    usage[r.time].bookings += 1;
    usage[r.time].covers   += r.partySize;
  }
  return usage;
}

export type CapacityResult = { ok: true } | { ok: false; reason: string; status: number };

/**
 * Checks whether a party fits a slot under the admin's capacity settings.
 * `excludeId` lets an edit ignore the booking being changed.
 */
export async function checkCapacity(
  day: string, time: string, partySize: number, excludeId?: string,
): Promise<CapacityResult> {
  const s = await getSettings();
  if (s.closedDates.includes(day)) {
    return { ok: false, status: 409, reason: "The restaurant is closed on this date." };
  }
  if (!getSlotsForDate(day).includes(time)) {
    return { ok: false, status: 400, reason: "That time is not a bookable slot on this day." };
  }
  const u = (await getSlotUsage(day, excludeId))[time] ?? { bookings: 0, covers: 0 };
  if (u.bookings >= s.maxBookingsPerSlot || u.covers + partySize > s.maxCoversPerSlot) {
    return { ok: false, status: 409, reason: "This time slot is fully booked. Please choose another time." };
  }
  return { ok: true };
}

/** Today's date in the restaurant's timezone (servers run in UTC). */
export function restaurantToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}
