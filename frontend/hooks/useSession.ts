"use client";
// hooks/useSession.ts
// Passes session_id and user_id to FastAPI so the pipeline
// can update the correct DB record without needing auth cookies.

import { useState } from "react";
import { useStore } from "@/lib/store";
import { aiApi } from "@/lib/api-client";
import {
  createSessionAction,
  deleteSessionAction,
  getSessionAction,
} from "@/actions/session.actions";
import { usePolling } from "./usePolling";

export function useSession() {
  const {
    addSession,
    updateSession,
    removeSession,
    setActiveSession,
    user,
  } = useStore();

  const { startPolling } = usePolling();
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");

  // ── Upload video ──────────────────────────────────────────────────────────
  async function handleUpload(file: File) {
    setError("");
    setUploading(true);

    // 1. Create DB placeholder — get session_id and user_id
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
      // Pass session_id and user_id as form fields — no Bearer token needed
      const form = new FormData();
      form.append("file",       file);
      form.append("session_id", sessionData.id);
      form.append("user_id",    userId);

      await aiApi.post("/upload/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      startPolling(sessionData.id);

    } catch (e: any) {
      const msg =
        e?.response?.data?.detail?.message ??
        e?.message ??
        "Upload failed.";
      setError(msg);
      updateSession(sessionData.id, { status: "ERROR" });
    } finally {
      setUploading(false);
    }
  }

  // ── YouTube ───────────────────────────────────────────────────────────────
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
      // Pass session_id and user_id in JSON body — no Bearer token needed
      await aiApi.post("/youtube/", {
        url,
        session_id: sessionData.id,
        user_id:    userId,
      });

      startPolling(sessionData.id);

    } catch (e: any) {
      const msg =
        e?.response?.data?.detail?.message ??
        e?.message ??
        "YouTube processing failed.";
      setError(msg);
      updateSession(sessionData.id, { status: "ERROR" });
    } finally {
      setUploading(false);
    }
  }

  // ── Load session ──────────────────────────────────────────────────────────
  async function loadSession(sessionId: string) {
    try {
      const full = await getSessionAction(sessionId);
      setActiveSession(sessionId, {
        ...full,
        createdAt: new Date(full.createdAt),
        updatedAt: new Date(full.updatedAt),
      });
      if (!["READY", "ERROR"].includes(full.status)) {
        startPolling(sessionId);
      }
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