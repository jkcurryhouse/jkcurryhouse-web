import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUnsubscribe } from "@/lib/unsubscribe";

// GET /api/unsubscribe?e=<email>&t=<hmac> — one-click opt-out from offer emails
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("e") ?? "").toLowerCase();
  const token = req.nextUrl.searchParams.get("t") ?? "";

  let ok = false;
  try {
    if (email && token && verifyUnsubscribe(email, token)) {
      await prisma.emailOptOut.upsert({ where: { email }, update: {}, create: { email } });
      ok = true;
    }
  } catch (err) {
    console.error("[GET /api/unsubscribe]", err);
  }

  const msg = ok
    ? "You've been unsubscribed from JK Curryhouse offer emails. Booking and order confirmations will still be sent."
    : "This unsubscribe link is invalid or has expired. Please contact hello@jkcurryhouse.co.uk.";
  return new NextResponse(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title>
     <body style="font-family:Georgia,serif;background:#f5f0eb;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
     <div style="background:#fff;border:1px solid #e5ddd4;padding:40px;max-width:440px;text-align:center">
     <h1 style="color:#0b0b0b;font-size:24px;margin:0 0 12px">JK Curryhouse</h1>
     <p style="font-family:Arial,sans-serif;color:#5c4033;line-height:1.6">${msg}</p>
     <a href="/" style="color:#8a6416">Back to website</a></div></body>`,
    { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
