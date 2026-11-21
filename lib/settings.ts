import "server-only";
import prisma from "@/lib/prisma";
import type { Settings } from "@prisma/client";

export const DEFAULT_SETTINGS: Omit<Settings, "updatedAt"> = {
  id: "default",
  acceptingOrders: true,
  acceptingReservations: true,
  deliveryEnabled: true,
  deliveryFee: 2.99,
  freeDeliveryThreshold: 25,
  minDeliveryOrder: 0,
  deliveryPostcodes: ["SN15", "SN14"],
  maxBookingsPerSlot: 3,
  maxCoversPerSlot: 20,
  maxPartySize: 12,
  closedDates: [],
  noticeBanner: null,
};

/** Reads the single settings row, creating it with defaults on first use. */
export async function getSettings(): Promise<Settings> {
  const existing = await prisma.settings.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: "default" } });
}

/** Settings safe to expose to the public website. */
export function publicSettings(s: Settings) {
  return {
    acceptingOrders:       s.acceptingOrders,
    acceptingReservations: s.acceptingReservations,
    deliveryEnabled:       s.deliveryEnabled,
    deliveryFee:           s.deliveryFee,
    freeDeliveryThreshold: s.freeDeliveryThreshold,
    minDeliveryOrder:      s.minDeliveryOrder,
    deliveryPostcodes:     s.deliveryPostcodes,
    maxPartySize:          s.maxPartySize,
    closedDates:           s.closedDates,
    noticeBanner:          s.noticeBanner,
  };
}
export type PublicSettings = ReturnType<typeof publicSettings>;
