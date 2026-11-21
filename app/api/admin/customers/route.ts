import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

interface Row {
  key: string; name: string; email: string; phone: string; hasAccount: boolean;
  orders: number; spend: number; bookings: number; noShows: number;
  lastSeen: string; optedOut: boolean;
}

// GET /api/admin/customers?q= — everyone who has ordered or booked, merged by email
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();

  try {
    const [orders, bookings, optOuts] = await Promise.all([
      prisma.order.findMany({
        where:  { status: { notIn: ["PENDING", "CANCELLED"] } },
        select: { userId: true, guestEmail: true, customerName: true, customerPhone: true, total: true, createdAt: true },
      }),
      prisma.reservation.findMany({
        select: { email: true, name: true, phone: true, status: true, date: true },
      }),
      prisma.emailOptOut.findMany({ select: { email: true } }),
    ]);
    const opted = new Set(optOuts.map((o) => o.email));
    const map   = new Map<string, Row>();
    const get   = (key: string) => {
      let r = map.get(key);
      if (!r) {
        r = { key, name: "", email: "", phone: "", hasAccount: false, orders: 0, spend: 0,
              bookings: 0, noShows: 0, lastSeen: new Date(0).toISOString(), optedOut: false };
        map.set(key, r);
      }
      return r;
    };
    const touch = (r: Row, d: Date) => { if (d.toISOString() > r.lastSeen) r.lastSeen = d.toISOString(); };

    for (const o of orders) {
      const email = o.guestEmail?.toLowerCase() ?? "";
      const key   = email || (o.userId ? `user:${o.userId}` : "");
      if (!key) continue;
      const r = get(key);
      r.email ||= email; r.name = o.customerName || r.name; r.phone = o.customerPhone || r.phone;
      r.hasAccount ||= !!o.userId; r.orders += 1; r.spend += o.total; touch(r, o.createdAt);
    }
    for (const b of bookings) {
      const email = b.email?.toLowerCase();
      const key   = email || `phone:${b.phone}`;
      const r = get(key);
      r.email ||= email ?? ""; r.name ||= b.name; r.phone ||= b.phone;
      if (b.status !== "CANCELLED") r.bookings += 1;
      if (b.status === "NO_SHOW")   r.noShows  += 1;
      touch(r, b.date);
    }

    let customers = Array.from(map.values()).map((r) => ({
      ...r, spend: Math.round(r.spend * 100) / 100, optedOut: !!r.email && opted.has(r.email),
    }));
    if (q) customers = customers.filter((c) =>
      c.name.toLowerCase().includes(q) || c.email.includes(q) || c.phone.includes(q));
    customers.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));

    return NextResponse.json({ customers: customers.slice(0, 1000), total: customers.length });
  } catch (err) {
    console.error("[GET /api/admin/customers]", err);
    return NextResponse.json({ error: "Failed to load customers." }, { status: 500 });
  }
}
