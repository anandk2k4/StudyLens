// app/api/sessions/[id]/status/route.ts
// Lightweight status endpoint — called by FastAPI pipeline to read current DB status
// Also called directly by frontend polling hook

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY ?? "";

// Status label map — mirrors backend ProcessingStatus.label
const STATUS_LABELS: Record<string, string> = {
  PROCESSING:             "Processing…",
  DOWNLOADING:            "Downloading video…",
  EXTRACTING_AUDIO:       "Extracting audio…",
  TRANSCRIBING:           "Transcribing audio…",
  GENERATING_EMBEDDINGS:  "Building search index…",
  GENERATING_SUMMARY:     "Generating summary…",
  GENERATING_NOTES:       "Generating notes…",
  GENERATING_QUIZ:        "Generating quiz…",
  GENERATING_FLASHCARDS:  "Generating flashcards…",
  READY:                  "Ready",
  ERROR:                  "Failed",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  // Allow internal FastAPI calls with shared key, or authenticated user calls
  const internalKey = req.headers.get("x-internal-key");
  const isInternal  = INTERNAL_KEY && internalKey === INTERNAL_KEY;

  if (!isInternal) {
    // Could add cookie auth here — for now internal-only
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where:  { id: sessionId },
    select: {
      id: true, status: true, title: true,
      errorMessage: true, updatedAt: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    session_id:   session.id,
    status:       session.status,
    label:        STATUS_LABELS[session.status] ?? session.status,
    title:        session.title,
    errorMessage: session.errorMessage,
    updatedAt:    session.updatedAt,
  });
}