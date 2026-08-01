"use server";
// actions/tutor.actions.ts
// Persists tutor conversation history per session.

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

async function requireUser(): Promise<string> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sl_access_token")?.value;
  if (accessToken) {
    try { return verifyAccessToken(accessToken).userId; } catch {}
  }
  const refreshToken = cookieStore.get("sl_refresh_token")?.value;
  if (refreshToken) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }, select: { userId: true, expiresAt: true },
    });
    if (stored && stored.expiresAt > new Date()) return stored.userId;
  }
  throw new Error("Unauthorized");
}

// ── Verify session ownership ──────────────────────────────────────────────────

async function verifySessionOwnership(sessionId: string, userId: string) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });
  if (!session) throw new Error("Session not found or access denied.");
}

// ── Save a tutor message (user question or assistant response) ──────────────

export async function saveTutorMessageAction(
  sessionId: string,
  role:      "user" | "assistant",
  content:   Record<string, unknown>
) {
  const userId = await requireUser();
  await verifySessionOwnership(sessionId, userId);

  const message = await prisma.tutorMessage.create({
    data: { sessionId, role, content: content as any },
  });

  return message;
}

// ── Get tutor history for a session ──────────────────────────────────────────

export async function getTutorHistoryAction(sessionId: string) {
  const userId = await requireUser();
  await verifySessionOwnership(sessionId, userId);

  return prisma.tutorMessage.findMany({
    where:   { sessionId },
    orderBy: { createdAt: "asc" },
  });
}

// ── Clear tutor history for a session ────────────────────────────────────────

export async function clearTutorHistoryAction(sessionId: string) {
  const userId = await requireUser();
  await verifySessionOwnership(sessionId, userId);

  await prisma.tutorMessage.deleteMany({ where: { sessionId } });
}