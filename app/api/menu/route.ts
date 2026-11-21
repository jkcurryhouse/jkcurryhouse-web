import { NextResponse } from "next/server";
import { getPublicMenu } from "@/lib/menu-repo";

export const dynamic = "force-dynamic";

// GET /api/menu — public: dishes currently available to customers.
// (Admin create/edit/delete lives under /api/admin/menu.)
export async function GET() {
  const { items, source } = await getPublicMenu();
  return NextResponse.json({ items, source });
}
