"use client";
// hooks/useSession.ts
// Updated to pass user_id, title, source to store_segments via pipeline

import { useState } from "react";
import { useStore } from "@/lib/store";
import { aiApi } from "@/lib/api-client";
import {
  createSessionAction,
  deleteSessionAction,
  getSessionAction,
} from "@/actions/session.actions";
import { usePolling } from "./usePolling";

async function updateSessionViaAPI(sessionId: string, userId: string, data: object) {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method:      "PATCH",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify({ ...data, _userId: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Session update failed (${res.status})`);
  }
  return (await res.json()).session;
}

export function useSession() {
  const { addSession, updateSession, removeSession, setActiveSession, user } = useStore();
  const { startPolling } = usePolling();
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");

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
      const form = new FormData();
      form.append("file",       file);
      form.append("session_id", sessionData.id);
      form.append("user_id",    userId);
      // Pass title and source so embedding metadata is complete
      form.append("title",      sessionData.title);
      form.append("source",     "UPLOAD");

      await aiApi.post("/upload/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      startPolling(sessionData.id);

    } catch (e: any) {
      const msg = e?.response?.data?.detail?.message ?? e?.message ?? "Upload failed.";
      setError(msg);
      updateSession(sessionData.id, { status: "ERROR" });
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
      await aiApi.post("/youtube/", {
        url,
        session_id: sessionData.id,
        user_id:    userId,
        source:     "YOUTUBE",
      });

      startPolling(sessionData.id);

    } catch (e: any) {
      const msg = e?.response?.data?.detail?.message ?? e?.message ?? "YouTube failed.";
      setError(msg);
      updateSession(sessionData.id, { status: "ERROR" });
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

  return { handleUpload, handleYouTube, loadSession, handleDelete, uploading, error, setError };
}