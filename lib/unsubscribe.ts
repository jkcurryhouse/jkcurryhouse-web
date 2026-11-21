import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jkcurryhouse.co.uk";

function secret() {
  const s = process.env.UNSUBSCRIBE_SECRET;
  if (!s) throw new Error("UNSUBSCRIBE_SECRET is not set");
  return s;
}

function sign(email: string) {
  return createHmac("sha256", secret()).update(email.toLowerCase()).digest("base64url");
}

export function unsubscribeUrl(email: string) {
  const e = encodeURIComponent(email.toLowerCase());
  return `${SITE_URL}/api/unsubscribe?e=${e}&t=${sign(email)}`;
}

export function verifyUnsubscribe(email: string, token: string) {
  const a = Buffer.from(sign(email));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
