// ── Offer business logic ─────────────────────────────────────────────────────

export interface OfferRecord {
  id: string;
  title: string;
  description: string;
  code: string;
  discount: number;
  isPercent: boolean;
  isGeneral: boolean;
  minOrders: number;
  minSpend: number;
  expiresAt: Date | string;
}

/** Format discount label, e.g. "20% off" or "£3.00 off" */
export function formatDiscount(offer: Pick<OfferRecord, "discount" | "isPercent">): string {
  return offer.isPercent
    ? `${offer.discount}% off`
    : `£${offer.discount.toFixed(2)} off`;
}

/** How many days until an offer expires (negative = already expired) */
export function daysUntilExpiry(expiresAt: Date | string): number {
  const exp = new Date(expiresAt);
  const now = new Date();
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Personalisation rules: decide which offers a user unlocks based on stats */
export interface UserStats {
  completedOrders: number;   // DELIVERED + CONFIRMED orders
  totalSpend: number;        // lifetime spend (non-cancelled)
}

/** Check if a user meets the unlock criteria for an offer */
export function userMeetsOfferCriteria(
  offer: Pick<OfferRecord, "minOrders" | "minSpend">,
  stats: UserStats
): boolean {
  if (offer.minOrders > 0 && stats.completedOrders < offer.minOrders) return false;
  if (offer.minSpend  > 0 && stats.totalSpend     < offer.minSpend)  return false;
  return true;
}

/** Resolve the £ or % off value to a concrete discount amount */
export function resolveDiscount(
  offer: Pick<OfferRecord, "discount" | "isPercent">,
  subtotal: number
): number {
  if (offer.isPercent) {
    return parseFloat(((subtotal * offer.discount) / 100).toFixed(2));
  }
  return Math.min(offer.discount, subtotal); // never discount more than subtotal
}
