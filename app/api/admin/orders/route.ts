import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

// GET /api/admin/orders?status=&type=&from=YYYY-MM-DD&includeUnpaid=1
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const sp = req.nextUrl.searchParams;
  const where: Prisma.OrderWhereInput = {};
  const status = sp.get("status"), type = sp.get("type"), from = sp.get("from");
  if (status) where.status = status as Prisma.EnumOrderStatusFilter["equals"];
  else if (sp.get("includeUnpaid") !== "1") where.status = { not: "PENDING" }; // abandoned checkouts hidden by default
  if (type)   where.type = type as Prisma.EnumOrderTypeFilter["equals"];
  if (from)   where.createdAt = { gte: new Date(`${from}T00:00:00`) };

  try {
    const orders = await prisma.order.findMany({
      where, include: { items: true }, orderBy: { createdAt: "desc" }, take: 200,
    });
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[GET /api/admin/orders]", err);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
