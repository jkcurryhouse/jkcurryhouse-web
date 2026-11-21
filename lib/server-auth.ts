// Server-only auth helpers for API routes.
// Verifies Cognito ID tokens cryptographically (signature, expiry, issuer, audience)
// against the user pool's public JWKS. Never trust a decoded-but-unverified JWT.
import "server-only";
import { NextResponse } from "next/server";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import prisma from "@/lib/prisma";

export const ADMIN_GROUP = "Admins";

export interface Identity {
  sub: string;
  email: string;
  name: string;
  groups: string[];
  isAdmin: boolean;
}

type Verifier = ReturnType<typeof CognitoJwtVerifier.create<{
  userPoolId: string; tokenUse: "id"; clientId: string;
}>>;

let verifier: Verifier | null = null;

function getVerifier(): Verifier | null {
  if (verifier) return verifier;
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId   = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId || userPoolId.includes("XXXX")) {
    console.error("[auth] Cognito env vars missing — all authenticated API calls will be rejected.");
    return null;
  }
  verifier = CognitoJwtVerifier.create({ userPoolId, tokenUse: "id", clientId });
  return verifier;
}

/** Returns the verified caller identity, or null if no/invalid token. */
export async function getIdentity(req: Request): Promise<Identity | null> {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const v = getVerifier();
  if (!v) return null;

  try {
    const payload = await v.verify(header.slice(7));
    const groups  = (payload["cognito:groups"] as string[] | undefined) ?? [];
    return {
      sub:     payload.sub,
      email:   String(payload.email ?? ""),
      name:    String(payload.name ?? ""),
      groups,
      isAdmin: groups.includes(ADMIN_GROUP),
    };
  } catch {
    return null;
  }
}

type Guard = { identity: Identity; error?: never } | { identity?: never; error: NextResponse };

/** Use at the top of every admin route:
 *    const auth = await requireAdmin(req); if (auth.error) return auth.error;
 */
export async function requireAdmin(req: Request): Promise<Guard> {
  const identity = await getIdentity(req);
  if (!identity) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }
  if (!identity.isAdmin) {
    return { error: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }
  return { identity };
}

/** Allows the signed-in user to act on their own data (userId === token sub), or any admin. */
export async function requireSelfOrAdmin(req: Request, userId: string): Promise<Guard> {
  const identity = await getIdentity(req);
  if (!identity) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }
  if (!identity.isAdmin && identity.sub !== userId) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return { identity };
}

/** Record an admin action. Never throws — auditing must not break the action itself. */
export async function audit(
  identity: Identity,
  action: string,
  entity: string,
  entityId: string | null,
  summary: string,
) {
  try {
    await prisma.auditLog.create({
      data: { actorEmail: identity.email || identity.sub, action, entity, entityId, summary },
    });
  } catch (err) {
    console.error("[audit] failed to write log", err);
  }
}
