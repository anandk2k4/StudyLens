// hooks/usePolling.ts
// Phase 6 — Frontend polling hook.
// Polls session status every 3s when PROCESSING.
// Stops automatically on READY or ERROR.
// Survives page refresh and re-login.

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import { getSessionAction } from "@/actions/session.actions";

const TERMINAL_STATUSES = ["READY", "ERROR"];
const POLL_INTERVAL_MS  = 3000;

// Status labels — mirrors backend ProcessingStatus
export const STATUS_LABELS: Record<string, string> = {
  PROCESSING:              "Processing…",
  DOWNLOADING:             "Downloading video…",
  EXTRACTING_AUDIO:        "Extracting audio…",
  TRANSCRIBING:            "Transcribing audio…",
  BUILDING_KNOWLEDGE_BASE: "Building Knowledge Base…",
  KNOWLEDGE_BASE_READY:    "Knowledge Base ready…",
  GENERATING_EMBEDDINGS:   "Building search index…",
  GENERATING_FEATURES:     "Generating study materials…",
  GENERATING_SUMMARY:      "Generating summary…",
  GENERATING_NOTES:        "Generating notes…",
  GENERATING_QUIZ:         "Generating quiz…",
  GENERATING_FLASHCARDS:   "Generating flashcards…",
  READY:                   "Ready",
  ERROR:                   "Failed",
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? "Processing…";
}

export function isTerminal(status: string): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function usePolling() {
  const { sessions, updateSession, setActiveSession, activeSessionId } = useStore();
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startPolling = useCallback((sessionId: string) => {
    // Don't double-poll
    if (timersRef.current.has(sessionId)) return;

    const poll = async () => {
      try {
        const full = await getSessionAction(sessionId);
        const status = full.status as string;

        // Update store with latest status
        updateSession(sessionId, {
          ...full,
          createdAt: new Date(full.createdAt),
          updatedAt: new Date(full.updatedAt),
          status: status as any,
        });

        // If this is the active session and it just became READY, load full data
        if (status === "READY" && sessionId === activeSessionId) {
          setActiveSession(sessionId, {
            ...full,
            createdAt: new Date(full.createdAt),
            updatedAt: new Date(full.updatedAt),
            // Narrow status to satisfy SessionFull typing
            status: status as any,
          });
        }

        // Stop polling if terminal
        if (isTerminal(status)) {
          stopPolling(sessionId);
          return;
        }

        // Schedule next poll
        const timer = setTimeout(poll, POLL_INTERVAL_MS);
        timersRef.current.set(sessionId, timer);

      } catch (err) {
        // Session load failed — stop polling to avoid hammering
        console.error(`Polling failed for ${sessionId}:`, err);
        stopPolling(sessionId);
      }
    };

    // Start first poll
    const timer = setTimeout(poll, POLL_INTERVAL_MS);
    timersRef.current.set(sessionId, timer);
  }, [updateSession, setActiveSession, activeSessionId]);

  const stopPolling = useCallback((sessionId: string) => {
    const timer = timersRef.current.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(sessionId);
    }
  }, []);

  // On mount — start polling for any PROCESSING sessions
  // This handles page refresh mid-processing
  useEffect(() => {
    sessions.forEach((session) => {
      if (!isTerminal(session.status) && !timersRef.current.has(session.id)) {
        startPolling(session.id);
      }
    });
  }, [sessions, startPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return { startPolling, stopPolling };
}