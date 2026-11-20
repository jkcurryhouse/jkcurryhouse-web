import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// PATCH /api/reservations/[id] — update status (admin use)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status } = body;

    if (!["PENDING", "CONFIRMED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const reservation = await prisma.reservation.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ ok: true, reservation });
  } catch (err) {
    console.error("[PATCH /api/reservations/[id]]", err);
    return NextResponse.json({ error: "Failed to update reservation." }, { status: 500 });
  }
}

// GET /api/reservations/[id] — get single reservation
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: params.id } });
    if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ reservation });
  } catch (err) {
    console.error("[GET /api/reservations/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch reservation." }, { status: 500 });
  }
}
