// ── Cookie helpers ─────────────────────────────────────────────────────────
// Access token goes in memory (zustand) — never in localStorage
// Refresh token goes in an HttpOnly cookie — never readable by JS

import { cookies } from "next/headers";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const COOKIE_NAME = "sl_refresh_token";

const COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export async function setRefreshTokenCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

export async function getRefreshTokenCookie(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_NAME)?.value;
}

export async function clearRefreshTokenCookie() {
  (await cookies()).set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}
