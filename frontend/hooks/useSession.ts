"use client";
// hooks/useSession.ts
// Passes userId in the PATCH body so the route never needs to re-resolve
// from cookies — eliminates the auth timing issue entirely

import { useState } from "react";
import { useStore } from "@/lib/store";
import { uploadVideoAPI, downloadYouTubeAPI } from "@/lib/api-client";
import {
  createSessionAction,
  deleteSessionAction,
  getSessionAction,
} from "@/actions/session.actions";

async function updateSessionViaAPI(
  sessionId: string,
  userId: string,
  data: object
) {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method:      "PATCH",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    // userId is sent in the body as a fallback identifier
    body: JSON.stringify({ ...data, _userId: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Session update failed (${res.status})`);
  }
  return (await res.json()).session;
}

export function useSession() {
  const {
    addSession,
    updateSession,
    removeSession,
    setActiveSession,
  } = useStore();

  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");

  async function markError(
    sessionId: string,
    userId: string,
    message: string
  ) {
    setError(message);
    try {
      await updateSessionViaAPI(sessionId, userId, { status: "ERROR" });
    } catch {}
    updateSession(sessionId, { status: "ERROR" });
  }

  function buildPayload(aiData: any, fallbackTitle: string) {
    return {
      status:     "READY",
      videoUrl:   aiData.video_url,
      videoId:    aiData.video_id,
      title:      aiData.filename || aiData.title || fallbackTitle,
      duration:   aiData.segments?.at(-1)?.end,
      transcript: aiData.transcript,
      summary:    aiData.summary,
      notes:      aiData.notes,
      quiz:       aiData.quiz,
      segments:   aiData.segments,
      flashcards: aiData.flashcards ?? [],
    };
  }

  async function handleUpload(file: File) {
    setError("");
    setUploading(true);

    let dbSession: any;
    try {
      dbSession = await createSessionAction({
        title:  file.name.replace(/\.[^.]+$/, ""),
        source: "UPLOAD",
      });
    } catch {
      setError("Failed to create session. Are you logged in?");
      setUploading(false);
      return;
    }

    const { userId, ...sessionData } = dbSession;

    addSession({
      ...sessionData,
      createdAt: new Date(sessionData.createdAt),
      updatedAt: new Date(sessionData.updatedAt),
    });
    setActiveSession(sessionData.id);

    try {
      const aiData  = await uploadVideoAPI(file);
      const updated = await updateSessionViaAPI(
        sessionData.id,
        userId,
        buildPayload(aiData, sessionData.title)
      );
      const parsed = {
        ...updated,
        createdAt: new Date(updated.createdAt),
        updatedAt: new Date(updated.updatedAt),
      };
      updateSession(sessionData.id, parsed);
      setActiveSession(sessionData.id, parsed);
    } catch (e: any) {
      await markError(
        sessionData.id,
        userId,
        e?.response?.data?.detail?.message ?? e?.message ?? "Processing failed."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleYouTube(url: string) {
    setError("");
    setUploading(true);

    let dbSession: any;
    try {
      dbSession = await createSessionAction({
        title:  "YouTube video…",
        source: "YOUTUBE",
      });
    } catch {
      setError("Failed to create session. Are you logged in?");
      setUploading(false);
      return;
    }

    const { userId, ...sessionData } = dbSession;

    addSession({
      ...sessionData,
      createdAt: new Date(sessionData.createdAt),
      updatedAt: new Date(sessionData.updatedAt),
    });
    setActiveSession(sessionData.id);

    try {
      const aiData  = await downloadYouTubeAPI(url);
      const updated = await updateSessionViaAPI(
        sessionData.id,
        userId,
        buildPayload(aiData, "YouTube video")
      );
      const parsed = {
        ...updated,
        createdAt: new Date(updated.createdAt),
        updatedAt: new Date(updated.updatedAt),
      };
      updateSession(sessionData.id, parsed);
      setActiveSession(sessionData.id, parsed);
    } catch (e: any) {
      await markError(
        sessionData.id,
        userId,
        e?.response?.data?.detail?.message ?? e?.message ?? "YouTube processing failed."
      );
    } finally {
      setUploading(false);
    }
  }

  async function loadSession(sessionId: string) {
    try {
      const full = await getSessionAction(sessionId);
      setActiveSession(sessionId, {
        ...full,
        createdAt: new Date(full.createdAt),
        updatedAt: new Date(full.updatedAt),
      });
    } catch {
      setError("Could not load session.");
    }
  }

  async function handleDelete(sessionId: string) {
    try {
      await deleteSessionAction(sessionId);
      removeSession(sessionId);
    } catch {
      setError("Could not delete session.");
    }
  }

  return {
    handleUpload,
    handleYouTube,
    loadSession,
    handleDelete,
    uploading,
    error,
    setError,
  };
}