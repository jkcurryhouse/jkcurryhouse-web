// Client-side admin check (UI gating only). The real security boundary is
// requireAdmin() in lib/server-auth.ts, which every admin API route calls.
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";

export interface AdminUser {
  userId: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

/** Returns the signed-in user if they are in the Cognito "Admins" group, otherwise null. */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;
    if (!idToken) return null;

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
