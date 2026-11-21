import { z } from "zod";

const ALLERGENS = ["gluten","dairy","nuts","egg","soy","shellfish","fish","celery","mustard","sesame"] as const;
const CATEGORIES = ["STARTER","MAIN","SIDE","RICE","BREAD","SPECIAL"] as const;
const DAY  = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const TIME = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM");

// ── Menu ─────────────────────────────────────────────────────────────────────
// Field rules WITHOUT defaults, so partial updates only touch the fields sent.
// (A .default() inside .partial() would silently reset omitted fields.)
const menuFields = {
  name:         z.string().trim().min(2).max(120),
  description:  z.string().trim().min(2).max(600),
  price:        z.number().positive().max(500),
  category:     z.enum(CATEGORIES),
  isSpecial:    z.boolean(),
  isAvailable:  z.boolean(),
  isVegan:      z.boolean(),
  isVegetarian: z.boolean(),
  isSpicy:      z.boolean(),
  chefPick:     z.boolean(),
  sortOrder:    z.number().int().min(0).max(9999),
  allergens:    z.array(z.enum(ALLERGENS)),
  imageUrl:     z.string().url().max(1000).nullable(),
};
export const menuItemCreate = z.object({
  ...menuFields,
  isSpecial:    menuFields.isSpecial.default(false),
  isAvailable:  menuFields.isAvailable.default(true),
  isVegan:      menuFields.isVegan.default(false),
  isVegetarian: menuFields.isVegetarian.default(false),
  isSpicy:      menuFields.isSpicy.default(false),
  chefPick:     menuFields.chefPick.default(false),
  sortOrder:    menuFields.sortOrder.default(0),
  allergens:    menuFields.allergens.default([]),
  imageUrl:     menuFields.imageUrl.optional(),
});
export const menuItemUpdate = z.object(menuFields).partial();

// ── Offers ───────────────────────────────────────────────────────────────────
const offerFields = {
  title:          z.string().trim().min(2).max(120),
  description:    z.string().trim().max(500),
  code:           z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,24}$/, "3–24 letters, numbers, - or _"),
  discount:       z.number().positive(),
  isPercent:      z.boolean(),
  isGeneral:      z.boolean(),
  isActive:       z.boolean(),
  minOrders:      z.number().int().min(0),
  minSpend:       z.number().min(0),
  minOrderValue:  z.number().min(0),
  maxRedemptions: z.number().int().positive().nullable(),
  startsAt:       z.coerce.date(),
  expiresAt:      z.coerce.date(),
};
const percentCap = (o: { isPercent?: boolean; discount?: number }) =>
  !(o.isPercent && (o.discount ?? 0) > 100);
export const offerCreate = z.object({
  ...offerFields,
  description:    offerFields.description.default(""),
  isPercent:      offerFields.isPercent.default(true),
  isGeneral:      offerFields.isGeneral.default(true),
  isActive:       offerFields.isActive.default(true),
  minOrders:      offerFields.minOrders.default(0),
  minSpend:       offerFields.minSpend.default(0),
  minOrderValue:  offerFields.minOrderValue.default(0),
  maxRedemptions: offerFields.maxRedemptions.optional(),
  startsAt:       offerFields.startsAt.optional(),
})
  .refine(percentCap, { message: "A percentage discount can't exceed 100%", path: ["discount"] })
  .refine((o) => !o.startsAt || o.startsAt < o.expiresAt, { message: "Expiry must be after start", path: ["expiresAt"] });
export const offerUpdate = z.object(offerFields).partial()
  .refine(percentCap, { message: "A percentage discount can't exceed 100%", path: ["discount"] });

export const offerRollout = z.object({
  sendEmail: z.boolean().default(false),
});

// ── Reservations (admin) ─────────────────────────────────────────────────────
export const adminReservationCreate = z.object({
  name:           z.string().trim().min(2).max(100),
  email:          z.string().trim().email().or(z.literal("")).default(""),
  phone:          z.string().trim().min(7).max(20),
  date:           DAY,
  time:           TIME,
  partySize:      z.number().int().min(1).max(60),
  specialRequest: z.string().max(500).optional(),
  source:         z.enum(["PHONE","WALK_IN","ONLINE"]).default("PHONE"),
  status:         z.enum(["PENDING","CONFIRMED","SEATED"]).default("CONFIRMED"),
  tableNumber:    z.string().max(20).optional(),
  adminNotes:     z.string().max(1000).optional(),
  sendEmail:      z.boolean().default(true),
  overrideCapacity: z.boolean().default(false),
});

export const adminReservationUpdate = z.object({
  name:           z.string().trim().min(2).max(100).optional(),
  email:          z.string().trim().email().or(z.literal("")).optional(),
  phone:          z.string().trim().min(7).max(20).optional(),
  date:           DAY.optional(),
  time:           TIME.optional(),
  partySize:      z.number().int().min(1).max(60).optional(),
  specialRequest: z.string().max(500).nullable().optional(),
  status:         z.enum(["PENDING","CONFIRMED","SEATED","COMPLETED","NO_SHOW","CANCELLED"]).optional(),
  tableNumber:    z.string().max(20).nullable().optional(),
  adminNotes:     z.string().max(1000).nullable().optional(),
  notifyGuest:    z.boolean().default(false),
  overrideCapacity: z.boolean().default(false),
});

// ── Orders ───────────────────────────────────────────────────────────────────
export const orderStatusUpdate = z.object({
  status: z.enum(["PENDING","CONFIRMED","PREPARING","READY","DELIVERED","CANCELLED"]),
  refund: z.boolean().default(false),
});

// ── Settings ─────────────────────────────────────────────────────────────────
export const settingsUpdate = z.object({
  acceptingOrders:       z.boolean(),
  acceptingReservations: z.boolean(),
  deliveryEnabled:       z.boolean(),
  deliveryFee:           z.number().min(0).max(50),
  freeDeliveryThreshold: z.number().min(0).max(1000),
  minDeliveryOrder:      z.number().min(0).max(1000),
  deliveryPostcodes:     z.array(z.string().trim().toUpperCase().regex(/^[A-Z]{1,2}\d{1,2}[A-Z]?$/, "Postcode district like SN15")).max(50),
  maxBookingsPerSlot:    z.number().int().min(1).max(100),
  maxCoversPerSlot:      z.number().int().min(1).max(500),
  maxPartySize:          z.number().int().min(1).max(60),
  closedDates:           z.array(DAY).max(366),
  noticeBanner:          z.string().trim().max(300).nullable(),
}).partial();

/** Turn a ZodError into a short message for toasts. */
export function zodMessage(err: z.ZodError): string {
  const i = err.issues[0];
  return i ? `${i.path.join(".") || "input"}: ${i.message}` : "Invalid input";
}
