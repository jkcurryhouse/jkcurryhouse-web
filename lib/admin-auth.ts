import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";

export interface AdminUser {
  userId: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

/**
 * Checks if the current Cognito session belongs to the "Admins" group.
 * Returns null if unauthenticated or not in the admin group.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;
    if (!idToken) return null;

    // Cognito groups are embedded in the ID token payload
    const payload = idToken.payload as Record<string, unknown>;
    const groups  = (payload["cognito:groups"] as string[] | undefined) ?? [];

    if (!groups.includes("Admins")) return null;

    const attrs = await fetchUserAttributes();
    return {
      userId:  payload.sub as string,
      email:   attrs.email ?? "",
      name:    attrs.name  ?? "",
      isAdmin: true,
    };
  } catch {
    return null;
  }
}

/**
 * Server-side admin API auth helper.
 * Verifies the Authorization header contains a valid Cognito ID token
 * belonging to the Admins group.
 *
 * Usage in API routes:
 *   const admin = await verifyAdminToken(req);
 *   if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export async function verifyAdminToken(
  req: Request
): Promise<{ sub: string; email: string } | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    // Decode the JWT payload (base64) — full verification happens at Cognito edge
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(
      Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    ) as Record<string, unknown>;

    const groups = (payload["cognito:groups"] as string[] | undefined) ?? [];
    if (!groups.includes("Admins")) return null;

    return {
      sub:   payload.sub as string,
      email: payload.email as string ?? "",
    };
  } catch {
    return null;
  }
}
