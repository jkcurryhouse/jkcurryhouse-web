import "server-only";
import prisma from "@/lib/prisma";
import type { Offer } from "@prisma/client";
import { resolveDiscount, userMeetsOfferCriteria, type UserStats } from "@/lib/offers";

export const COUNTED_ORDER_STATUSES = ["CONFIRMED", "PREPARING", "READY", "DELIVERED"] as const;

/** Offer is switched on, has started, hasn't expired and hasn't hit its redemption cap. */
export function isOfferLive(o: Offer, now = new Date()): boolean {
  if (!o.isActive) return false;
  if (o.startsAt > now || o.expiresAt <= now) return false;
  if (o.maxRedemptions != null && o.redemptionCount >= o.maxRedemptions) return false;
  return true;
}

export function liveOfferWhere(now = new Date()) {
  return { isActive: true, startsAt: { lte: now }, expiresAt: { gt: now } };
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const orders = await prisma.order.findMany({
    where:  { userId, status: { in: [...COUNTED_ORDER_STATUSES] } },
    select: { total: true },
  });
  return {
    completedOrders: orders.length,
    totalSpend:      orders.reduce((s, o) => s + o.total, 0),
  };
}

export type OfferCheck =
  | { ok: true; offer: Offer; amount: number }
  | { ok: false; error: string; status: number };

/**
 * The single source of truth for whether a code can be used on an order.
 * Used by the cart's "apply code" check AND again when the order is created,
 * so a customer can't bypass it by editing the request.
 */
export async function checkOfferForOrder(
  rawCode: string, subtotal: number, userId: string | null,
): Promise<OfferCheck> {
  const code  = rawCode.trim().toUpperCase();
  const offer = await prisma.offer.findUnique({ where: { code } });
  if (!offer) return { ok: false, status: 404, error: "Code not found." };

  const now = new Date();
  if (!offer.isActive)           return { ok: false, status: 410, error: "This offer is not currently running." };
  if (offer.startsAt > now)      return { ok: false, status: 410, error: "This offer hasn't started yet." };
  if (offer.expiresAt <= now)    return { ok: false, status: 410, error: "This code has expired." };
  if (offer.maxRedemptions != null && offer.redemptionCount >= offer.maxRedemptions) {
    return { ok: false, status: 410, error: "This offer has been fully redeemed." };
  }
  if (subtotal < offer.minOrderValue) {
    return { ok: false, status: 422, error: `Minimum order of £${offer.minOrderValue.toFixed(2)} for this code.` };
  }

  if (!offer.isGeneral) {
    if (!userId) return { ok: false, status: 401, error: "Sign in to use this personalised offer." };
    const uo = await prisma.userOffer.findUnique({
      where: { userId_offerId: { userId, offerId: offer.id } },
    });
    if (!uo) {
      // Not assigned yet — allow if they meet the unlock criteria now
      const stats = await getUserStats(userId);
      if (!userMeetsOfferCriteria(offer, stats)) {
        return { ok: false, status: 403, error: "This offer isn't available on your account." };
      }
    } else if (uo.redeemedAt) {
      return { ok: false, status: 410, error: "You've already used this offer." };
    }
  }

  return { ok: true, offer, amount: resolveDiscount(offer, subtotal) };
}
