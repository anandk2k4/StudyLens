// app/api/sessions/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { SessionStatus } from "@prisma/client";

async function getUserIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get("sl_access_token")?.value;
  if (accessToken) {
    try {
      return verifyAccessToken(accessToken).userId;
    } catch {}
  }

  const refreshToken = cookieStore.get("sl_refresh_token")?.value;
  if (refreshToken) {
    const stored = await prisma.refreshToken.findUnique({
      where:  { token: refreshToken },
      select: { userId: true, expiresAt: true },
    });
    if (stored && stored.expiresAt > new Date()) return stored.userId;
  }

  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID missing." }, { status: 400 });
    }

    const body = await req.json();

    // ── Resolve userId ────────────────────────────────────────────────────
    // Priority 1: _userId passed from hook (captured at session creation time)
    // Priority 2: cookie-based auth (fallback)
    let userId: string | null = null;

    if (body._userId && typeof body._userId === "string") {
      // Verify this userId actually exists in DB before trusting it
      const userExists = await prisma.user.findUnique({
        where:  { id: body._userId },
        select: { id: true },
      });
      if (userExists) userId = body._userId;
    }

    if (!userId) {
      userId = await getUserIdFromCookies();
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    // Remove internal field before saving
    const { _userId, ...updateData } = body;

    // ── Check session exists ──────────────────────────────────────────────
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    // ── Check ownership ───────────────────────────────────────────────────
    if (session.userId !== userId) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    // ── Update ────────────────────────────────────────────────────────────
    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status:     updateData.status     as SessionStatus,
        videoUrl:   updateData.videoUrl   ?? session.videoUrl,
        videoId:    updateData.videoId    ?? session.videoId,
        title:      updateData.title      ?? session.title,
        duration:   updateData.duration   ?? session.duration,
        transcript: updateData.transcript ?? session.transcript,
        summary:    updateData.summary    ?? session.summary,
        notes:      updateData.notes      ?? session.notes,
        quiz:       updateData.quiz       ?? session.quiz,
        segments:   updateData.segments   ?? session.segments,
        flashcards: updateData.flashcards ?? session.flashcards,
      },
    });

    return NextResponse.json({ session: updated }, { status: 200 });

  } catch (err) {
    console.error("[PATCH /api/sessions/:id]", err);
    return NextResponse.json({ error: "Failed to update session." }, { status: 500 });
  }
}