import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, audit } from "@/lib/server-auth";
import { getSettings } from "@/lib/settings";
import { settingsUpdate, zodMessage } from "@/lib/validators";
import { revalidatePublicMenu } from "@/lib/menu-repo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  try {
    return NextResponse.json({ settings: await getSettings() });
  } catch (err) {
    console.error("[GET /api/admin/settings]", err);
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req); if (auth.error) return auth.error;
  const parsed = settingsUpdate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });

  try {
    const data = { ...parsed.data };
    if (data.closedDates) data.closedDates = Array.from(new Set(data.closedDates)).sort();
    const settings = await prisma.settings.upsert({
      where: { id: "default" }, update: data, create: { id: "default", ...data },
    });

    const flags = [
      "acceptingOrders" in data ? `online orders ${data.acceptingOrders ? "ON" : "OFF"}` : null,
      "acceptingReservations" in data ? `online booking ${data.acceptingReservations ? "ON" : "OFF"}` : null,
      "deliveryEnabled" in data ? `delivery ${data.deliveryEnabled ? "ON" : "OFF"}` : null,
    ].filter(Boolean);
    await audit(auth.identity, "update", "settings", "default",
      `Settings saved${flags.length ? ` — ${flags.join(", ")}` : ""}`);
    revalidatePublicMenu();
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error("[PUT /api/admin/settings]", err);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
