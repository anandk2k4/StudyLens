"use server";
// actions/session.actions.ts
// createSessionAction now returns userId alongside the session
// so useSession can pass it directly to the PATCH route

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { SessionSource, SessionStatus } from "@prisma/client";

async function requireUser(): Promise<string> {
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

  throw new Error("Unauthorized");
}

// Returns session AND userId — hook stores userId for later use in PATCH
export async function createSessionAction(data: {
  title:  string;
  source: "UPLOAD" | "YOUTUBE";
}) {
  const userId = await requireUser();
  const session = await prisma.session.create({
    data: {
      userId,
      title:  data.title,
      source: data.source as SessionSource,
      status: "PROCESSING",
    },
  });
  revalidatePath("/dashboard");
  return { ...session, userId };   // ← userId included
}

export async function getSessionsAction() {
  const userId = await requireUser();
  return prisma.session.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, source: true, status: true,
      videoUrl: true, videoId: true, duration: true,
      thumbnail: true, createdAt: true, updatedAt: true,
    },
  });
}

export async function getSessionAction(sessionId: string) {
  const userId  = await requireUser();
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
    include: { knowledgeBase: true },
  });
  if (!session) throw new Error("Session not found");
  return session;
}

export async function deleteSessionAction(sessionId: string) {
  const userId = await requireUser();
  await prisma.session.deleteMany({ where: { id: sessionId, userId } });
  revalidatePath("/dashboard");
}