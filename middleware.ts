import { NextResponse, type NextRequest } from "next/server";

// Routes that require any Cognito session
const PROTECTED     = ["/account"];
// Routes that require a Cognito session with the Admins group
// (full group verification happens client-side in AdminContext;
//  middleware does a lightweight session-presence check as a first gate)
const ADMIN_ROUTES  = ["/admin"];
// Routes only for unauthenticated users
const AUTH_ONLY     = ["/auth/login", "/auth/register", "/auth/verify", "/auth/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = request.cookies.getAll().some(
    (c) => c.name.startsWith("CognitoIdentityServiceProvider") || c.name.includes("idToken")
  );

  // Admin routes: must have a session (group check happens in AdminShell)
  if (ADMIN_ROUTES.some((p) => pathname.startsWith(p)) && !hasSession) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protected customer routes
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasSession) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth-only: redirect already-signed-in users away
  if (AUTH_ONLY.some((p) => pathname.startsWith(p)) && hasSession) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/auth/:path*"],
};
