import { NextResponse, type NextRequest } from "next/server";
import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { requireAdmin, audit } from "@/lib/server-auth";
import { offerRollout, zodMessage } from "@/lib/validators";
import { formatDiscount, userMeetsOfferCriteria } from "@/lib/offers";
import { COUNTED_ORDER_STATUSES, isOfferLive } from "@/lib/offer-rules";
import { sendOfferEmail } from "@/lib/email";
import { unsubscribeUrl } from "@/lib/unsubscribe";

type Ctx = { params: { id: string } };

/** Emails per click. Keeps each request well inside hosting time limits and SES send rate. */
const EMAIL_BATCH = 150;

interface Customer { userId: string; email: string | null; name: string; orders: number; spend: number }

/** Account holders (customers with a Cognito userId on at least one paid order). */
async function accountCustomers(): Promise<Customer[]> {
  const orders = await prisma.order.findMany({
    where:   { userId: { not: null }, status: { in: [...COUNTED_ORDER_STATUSES] } },
    select:  { userId: true, guestEmail: true, customerName: true, total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const map = new Map<string, Customer>();
  for (const o of orders) {
    const c = map.get(o.userId!) ?? { userId: o.userId!, email: null, name: "", orders: 0, spend: 0 };
    c.orders += 1;
    c.spend  += o.total;
    if (o.guestEmail)   c.email = o.guestEmail.toLowerCase();   // latest wins
    if (o.customerName) c.name  = o.customerName;
    map.set(c.userId, c);
  }
  return Array.from(map.values());
}

async function plan(offerId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) return null;

  const customers = await accountCustomers();
  const eligible  = offer.isGeneral ? customers : customers.filter((c) => userMeetsOfferCriteria(offer, {
    completedOrders: c.orders, totalSpend: c.spend,
  }));

  const existing  = await prisma.userOffer.findMany({ where: { offerId }, select: { userId: true, notifiedAt: true, email: true } });
  const byUser    = new Map(existing.map((e) => [e.userId, e]));
  const optedOut  = new Set((await prisma.emailOptOut.findMany({ select: { email: true } })).map((o) => o.email));

  const toEmail = eligible.filter((c) => c.email && !optedOut.has(c.email) && !byUser.get(c.userId)?.notifiedAt);

  return {
    offer, eligible, toEmail,
    summary: {
      live:            isOfferLive(offer),
      accountHolders:  customers.length,
      eligible:        eligible.length,
      newlyAssigned:   offer.isGeneral ? 0 : eligible.filter((c) => !byUser.has(c.userId)).length,
      alreadyNotified: existing.filter((e) => e.notifiedAt).length,
      optedOut:        eligible.filter((c) => c.email && optedOut.has(c.email)).length,
      noEmail:         eligible.filter((c) => !c.email).length,
      toEmail:         toEmail.length,
    },
  };
}

// GET /api/admin/offers/[id]/rollout — preview who this offer would reach
export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  try {
    const p = await plan(params.id);
    if (!p) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    return NextResponse.json({ preview: p.summary, emailBatch: EMAIL_BATCH });
  } catch (err) {
    console.error("[GET rollout]", err);
    return NextResponse.json({ error: "Failed to preview rollout." }, { status: 500 });
  }
}

// POST /api/admin/offers/[id]/rollout { sendEmail } — assign to eligible customers, optionally email them
export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const parsed = offerRollout.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  try {
    const p = await plan(params.id);
    if (!p) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    if (!p.summary.live) {
      return NextResponse.json({ error: "Only live offers can be rolled out. Check it's active, started and not expired." }, { status: 409 });
    }
    const { offer, eligible, toEmail } = p;

    // 1. Assign (personalised: grants access; general: rows track who was notified)
    if (eligible.length) {
      await prisma.userOffer.createMany({
        data: eligible.map((c) => ({ userId: c.userId, offerId: offer.id, email: c.email })),
        skipDuplicates: true,
      });
    }

    // 2. Email, in a bounded batch
    let sent = 0, failed = 0;
    const batch = parsed.data.sendEmail ? toEmail.slice(0, EMAIL_BATCH) : [];
    if (batch.length && !process.env.UNSUBSCRIBE_SECRET) {
      return NextResponse.json({ error: "Set UNSUBSCRIBE_SECRET before sending offer emails." }, { status: 500 });
    }
    const label   = formatDiscount(offer);
    const expires = format(offer.expiresAt, "d MMMM yyyy");
    for (let i = 0; i < batch.length; i += 10) {
      const chunk   = batch.slice(i, i + 10);
      const results = await Promise.all(chunk.map((c) => sendOfferEmail({
        to: c.email!, name: c.name.split(" ")[0] ?? "", title: offer.title, description: offer.description,
        code: offer.code, discountLabel: label, expires, unsubscribeUrl: unsubscribeUrl(c.email!),
      })));
      const okIds = chunk.filter((_, j) => results[j].ok).map((c) => c.userId);
      sent   += okIds.length;
      failed += chunk.length - okIds.length;
      if (okIds.length) {
        await prisma.userOffer.updateMany({
          where: { offerId: offer.id, userId: { in: okIds } },
          data:  { notifiedAt: new Date() },
        });
      }
    }

    await prisma.offer.update({ where: { id: offer.id }, data: { lastRolledOutAt: new Date() } });
    const remaining = Math.max(0, toEmail.length - batch.length);
    await audit(auth.identity, "rollout", "offer", offer.id,
      `Rolled out ${offer.code} to ${eligible.length} customer(s)` +
      (parsed.data.sendEmail ? `; emailed ${sent}${failed ? `, ${failed} failed` : ""}${remaining ? `, ${remaining} still to send` : ""}` : ""));

    return NextResponse.json({ ok: true, assigned: eligible.length, sent, failed, remaining });
  } catch (err) {
    console.error("[POST rollout]", err);
    return NextResponse.json({ error: "Rollout failed." }, { status: 500 });
  }
}
