import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin, audit } from "@/lib/server-auth";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), confirm: z.literal(true) });

// POST /api/admin/customers/erase { email, confirm: true }
// GDPR right to erasure: anonymises personal data on orders and bookings while keeping
// the financial records (amounts, dates, dishes) that must be retained for accounting.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid email and confirm:true are required." }, { status: 400 });
  const { email } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const orders = await tx.order.updateMany({
        where: { guestEmail: { equals: email, mode: "insensitive" } },
        data:  { guestEmail: null, customerName: "Erased", customerPhone: null, address: null, userId: null },
      });
      const bookings = await tx.reservation.updateMany({
        where: { email: { equals: email, mode: "insensitive" } },
        data:  { name: "Erased", email: "", phone: "", specialRequest: null, adminNotes: null },
      });
      const offers = await tx.userOffer.deleteMany({ where: { email } });
      // keep them on the opt-out list so they never receive marketing again
      await tx.emailOptOut.upsert({ where: { email }, update: {}, create: { email } });
      return { orders: orders.count, bookings: bookings.count, offers: offers.count };
    });

    await audit(auth.identity, "erase", "customer", null,
      `GDPR erasure: ${result.orders} order(s), ${result.bookings} booking(s) anonymised`);
    return NextResponse.json({ ok: true, ...result,
      note: "If this person has a website account, also delete their user in AWS Cognito." });
  } catch (err) {
    console.error("[POST /api/admin/customers/erase]", err);
    return NextResponse.json({ error: "Erasure failed." }, { status: 500 });
  }
}
