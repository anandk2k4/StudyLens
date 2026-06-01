"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  generateSecureToken,
  refreshTokenExpiry,
} from "@/lib/auth";
import { RegisterSchema, LoginSchema } from "@/lib/validators";

// ── Shared cookie setter ──────────────────────────────────────────────────────
async function setAuthCookies(accessToken: string, refreshToken: string) {
  const secure = process.env.NODE_ENV === "production";
  const base   = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
  (await cookies()).set("sl_access_token",  accessToken,  { ...base, maxAge: 60 * 60 * 2 });
  (await cookies()).set("sl_refresh_token", refreshToken, { ...base, maxAge: 60 * 60 * 24 * 30 });
}

// ── Register ──────────────────────────────────────────────────────────────────
export async function registerAction(formData: FormData) {
  const raw = {
    name:     formData.get("name")     as string,
    email:    formData.get("email")    as string,
    password: formData.get("password") as string,
  };

  const result = RegisterSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, email, password } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });

  const accessToken  = signAccessToken({ userId: user.id, email: user.email });
  const rawToken     = generateSecureToken();

  await prisma.refreshToken.create({
    data: { userId: user.id, token: rawToken, expiresAt: refreshTokenExpiry() },
  });

  await setAuthCookies(accessToken, rawToken);

  // redirect() must be called outside try/catch in server actions
  redirect("/dashboard");
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const raw = {
    email:    formData.get("email")    as string,
    password: formData.get("password") as string,
  };

  const result = LoginSchema.safeParse(raw);
  if (!result.success) return { error: result.error.issues[0].message };

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid email or password." };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password." };

  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const rawToken    = generateSecureToken();

  // Rotate refresh tokens — invalidate all old ones
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  await prisma.refreshToken.create({
    data: { userId: user.id, token: rawToken, expiresAt: refreshTokenExpiry() },
  });

  await setAuthCookies(accessToken, rawToken);
  redirect("/dashboard");
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logoutAction() {
  const refreshCookie = (await cookies()).get("sl_refresh_token")?.value;
  if (refreshCookie) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshCookie } });
  }
  (await cookies()).delete("sl_access_token");
  (await cookies()).delete("sl_refresh_token");
  redirect("/login");
}

// ── Get current user (server components) ─────────────────────────────────────
export async function getCurrentUser() {
  const token = (await cookies()).get("sl_access_token")?.value;
  if (!token) return null;
  try {
    const { verifyAccessToken } = await import("@/lib/auth");
    const payload = verifyAccessToken(token);
    return prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
  } catch {
    return null;
  }
}