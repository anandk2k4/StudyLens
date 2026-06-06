// app/api/sessions/[id]/route.ts — updated to handle errorMessage + all new statuses

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY ?? "";

const VALID_STATUSES = [
  "PROCESSING", "DOWNLOADING", "EXTRACTING_AUDIO", "TRANSCRIBING",
  "GENERATING_EMBEDDINGS", "GENERATING_SUMMARY", "GENERATING_NOTES",
  "GENERATING_QUIZ", "GENERATING_FLASHCARDS", "READY", "ERROR",
] as const;

type SessionStatus = typeof VALID_STATUSES[number];

async function getUserId(
  req: NextRequest,
  bodyUserId?: string
): Promise<string | null> {
  // 1. Internal call from FastAPI — trust _userId from body (user exists check)
  if (bodyUserId) {
    const exists = await prisma.user.findUnique({
      where: { id: bodyUserId }, select: { id: true },
    });
    if (exists) return bodyUserId;
  }

  const cookieStore = await cookies();

  // 2. Access token
  const accessToken = cookieStore.get("sl_access_token")?.value;
  if (accessToken) {
    try {
      return verifyAccessToken(accessToken).userId;
    } catch {}
  }

  // 3. Refresh token fallback
  const refreshToken = cookieStore.get("sl_refresh_token")?.value;
  if (refreshToken) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }, select: { userId: true, expiresAt: true },
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
    const { _userId, errorMessage, ...updateData } = body;

    // Allow internal FastAPI pipeline calls
    const internalKey = req.headers.get("x-internal-key");
    const isInternal  = INTERNAL_KEY && internalKey === INTERNAL_KEY;

    const userId = isInternal
      ? (_userId ?? null)
      : await getUserId(req, _userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Validate status
    if (updateData.status && !VALID_STATUSES.includes(updateData.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    if (session.userId !== userId) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(updateData.status     && { status:       updateData.status as SessionStatus }),
        ...(errorMessage          && { errorMessage }),
        ...(updateData.videoUrl   !== undefined && { videoUrl:   updateData.videoUrl }),
        ...(updateData.videoId    !== undefined && { videoId:    updateData.videoId }),
        ...(updateData.title      !== undefined && { title:      updateData.title }),
        ...(updateData.duration   !== undefined && { duration:   updateData.duration }),
        ...(updateData.transcript !== undefined && { transcript: updateData.transcript }),
        ...(updateData.summary    !== undefined && { summary:    updateData.summary }),
        ...(updateData.notes      !== undefined && { notes:      updateData.notes }),
        ...(updateData.quiz       !== undefined && { quiz:       updateData.quiz }),
        ...(updateData.segments   !== undefined && { segments:   updateData.segments }),
        ...(updateData.flashcards !== undefined && { flashcards: updateData.flashcards }),
      },
    });

    return NextResponse.json({ session: updated }, { status: 200 });

  } catch (err) {
    console.error("[PATCH /api/sessions/:id]", err);
    return NextResponse.json({ error: "Failed to update session." }, { status: 500 });
  }
}