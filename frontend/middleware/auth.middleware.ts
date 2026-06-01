// ── Next.js Middleware — route protection ─────────────────────────────────────
// Runs on the Edge before every request to protected routes.
// Access token is stored in a non-HttpOnly cookie ONLY for the middleware
// (the actual access token in memory is in zustand client-side).
// We use the refresh-token cookie presence as the "logged in" signal here,
// then silently refresh access tokens in API routes.

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/register", "/"];
const AUTH_ROUTES = ["/login", "/register"];
const PROTECTED_PREFIX = ["/dashboard", "/learn"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIX.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  const accessToken = request.cookies.get("sl_access_token")?.value;
  const refreshToken = request.cookies.get("sl_refresh_token")?.value;

  // Verify access token if present
  let isAuthenticated = false;
  if (accessToken) {
    try {
      verifyAccessToken(accessToken);
      isAuthenticated = true;
    } catch {
      // Access token expired — let the API route handle silent refresh
      // Still consider "authenticated" if refresh token exists
      isAuthenticated = !!refreshToken;
    }
  } else {
    isAuthenticated = !!refreshToken;
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
