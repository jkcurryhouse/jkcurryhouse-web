import "server-only";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { checkOfferForOrder } from "@/lib/offer-rules";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-06-24.dahlia",
});

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Pull the outward code ("SN15") from a free-text UK address. */
export function outwardCode(address: string): string | null {
  const m = address.toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}\b/);
  return m ? m[1] : null;
}

export interface QuoteInput {
  mode: "delivery" | "takeaway";
  items: { menuItemId: string; quantity: number }[];
  discountCode?: string;
  deliveryAddress?: string;
  userId: string | null;
}

export type Quote =
  | { ok: true; subtotal: number; deliveryFee: number; discount: number; total: number;
      discountCode: string | null;
      lines: { menuItemId: string; name: string; price: number; quantity: number }[] }
  | { ok: false; status: number; error: string };

/** Prices an order from the database — never from what the browser sends. */
export async function quoteOrder(input: QuoteInput): Promise<Quote> {
  const s = await getSettings();
  if (!s.acceptingOrders) return { ok: false, status: 503, error: "We're not taking online orders right now. Please call 01249 123456." };
  if (input.mode === "delivery" && !s.deliveryEnabled) {
    return { ok: false, status: 503, error: "Delivery is unavailable right now — takeaway is still open." };
  }

  const ids  = Array.from(new Set(input.items.map((i) => i.menuItemId)));
  const rows = await prisma.menuItem.findMany({ where: { id: { in: ids }, isAvailable: true } });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    return { ok: false, status: 409, error: "Some dishes in your basket are no longer available. Please refresh the menu." };
  }

  const lines = input.items.map((i) => {
    const r = byId.get(i.menuItemId)!;
    return { menuItemId: r.id, name: r.name, price: r.price, quantity: i.quantity };
  });
  const subtotal = round2(lines.reduce((t, l) => t + l.price * l.quantity, 0));

  let deliveryFee = 0;
  if (input.mode === "delivery") {
    const oc = outwardCode(input.deliveryAddress ?? "");
    if (!oc) return { ok: false, status: 422, error: "Please include a full postcode in your delivery address." };
    if (!s.deliveryPostcodes.includes(oc)) {
      return { ok: false, status: 422, error: `Sorry, we only deliver to ${s.deliveryPostcodes.join(", ")}.` };
    }
    if (subtotal < s.minDeliveryOrder) {
      return { ok: false, status: 422, error: `Minimum delivery order is £${s.minDeliveryOrder.toFixed(2)}.` };
    }
    deliveryFee = subtotal >= s.freeDeliveryThreshold ? 0 : s.deliveryFee;
  }

  let discount = 0, discountCode: string | null = null;
  if (input.discountCode) {
    const check = await checkOfferForOrder(input.discountCode, subtotal, input.userId);
    if (!check.ok) return { ok: false, status: check.status, error: check.error };
    discount = round2(check.amount);
    discountCode = check.offer.code;
  }

  const total = round2(Math.max(0, subtotal + deliveryFee - discount));
  if (total < 0.3) return { ok: false, status: 422, error: "Order total is too low to take a card payment." };
  return { ok: true, subtotal, deliveryFee, discount, total, discountCode, lines };
}

/**
 * Moves a PENDING order to CONFIRMED after Stripe says it's paid, exactly once.
 * Safe to call from both the browser confirm step and the Stripe webhook.
 * Returns true if this call did the transition.
 */
export async function markOrderPaid(orderId: string): Promise<boolean> {
  const moved = await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data:  { status: "CONFIRMED" },
  });
  if (moved.count !== 1) return false;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order?.discountCode) {
    const offer = await prisma.offer.update({
      where: { code: order.discountCode },
      data:  { redemptionCount: { increment: 1 } },
    }).catch(() => null);
    if (offer && order.userId && !offer.isGeneral) {
      await prisma.userOffer.upsert({
        where:  { userId_offerId: { userId: order.userId, offerId: offer.id } },
        update: { redeemedAt: new Date() },
        create: { userId: order.userId, offerId: offer.id, redeemedAt: new Date(), email: order.guestEmail },
      });
    }
  }
  return true;
}
