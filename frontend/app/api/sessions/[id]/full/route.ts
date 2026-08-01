// app/api/sessions/[id]/full/route.ts
// Internal endpoint — returns full session including all JSON fields
// Called by FastAPI revision endpoint to get session data

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY ?? "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const internalKey = req.headers.get("x-internal-key");
  if (!INTERNAL_KEY || internalKey !== INTERNAL_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(session);
}