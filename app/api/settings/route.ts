import { NextResponse } from "next/server";
import { getSettings, publicSettings, DEFAULT_SETTINGS } from "@/lib/settings";

export const dynamic = "force-dynamic";

// GET /api/settings — public: ordering/booking switches, delivery fees, notice banner
export async function GET() {
  try {
    return NextResponse.json({ settings: publicSettings(await getSettings()) });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ settings: publicSettings({ ...DEFAULT_SETTINGS, updatedAt: new Date() }) });
  }
}
