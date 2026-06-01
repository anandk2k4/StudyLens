// app/api/auth/refresh/route.ts

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  generateSecureToken,
  refreshTokenExpiry,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const rawToken    = cookieStore.get("sl_refresh_token")?.value;

    if (!rawToken) {
      return NextResponse.json(
        { error: "No refresh token." },
        { status: 401 }
      );
    }

    // Validate token in DB
    const stored = await prisma.refreshToken.findUnique({
      where:   { token: rawToken },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!stored) {
      return NextResponse.json(
        { error: "Refresh token not found or already used." },
        { status: 401 }
      );
    }

    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { token: rawToken } });
      return NextResponse.json(
        { error: "Refresh token expired. Please log in again." },
        { status: 401 }
      );
    }

    const { user } = stored;

    // Rotate tokens
    await prisma.refreshToken.delete({ where: { token: rawToken } });

    const newAccessToken = signAccessToken({ userId: user.id, email: user.email });
    const newRawToken    = generateSecureToken();

    await prisma.refreshToken.create({
      data: {
        userId:    user.id,
        token:     newRawToken,
        expiresAt: refreshTokenExpiry(),
      },
    });

    const secure = process.env.NODE_ENV === "production";
    const base   = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };

    const response = NextResponse.json(
      { ok: true, userId: user.id },
      { status: 200 }
    );
    response.cookies.set("sl_access_token",  newAccessToken, { ...base, maxAge: 60 * 60 * 2 });  // 2h
    response.cookies.set("sl_refresh_token", newRawToken,    { ...base, maxAge: 60 * 60 * 24 * 30 });
    return response;

  } catch (err) {
    console.error("[POST /api/auth/refresh]", err);
    return NextResponse.json(
      { error: "Token refresh failed." },
      { status: 500 }
    );
  }
}