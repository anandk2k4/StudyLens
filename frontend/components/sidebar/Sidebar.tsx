"use client";

import { useRef, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useSession } from "@/hooks/useSession";
import { getSessionsAction } from "@/actions/session.actions";
import { getCurrentUser } from "@/actions/auth.actions";
import { UserMenu } from "../auth/UserMenu";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });
}
function formatDuration(sec?: number | null) {
  if (!sec) return "";
  return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, "0")}`;
}

// ── Silent token refresh ──────────────────────────────────────────────────────
async function silentRefresh(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function Sidebar() {
  const {
    sessions,
    activeSessionId,
    sidebarCollapsed,
    setSessions,
    setActiveSession,
    setSidebarCollapsed,
    setHydrated,
    setUser,
  } = useStore();

  const {
    handleUpload,
    handleYouTube,
    handleDelete,
    loadSession,
    uploading,
    error,
    setError,
  } = useSession();

  const [tab, setTab] = useState<"upload" | "youtube">("upload");
  const [ytUrl, setYtUrl] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── On mount: refresh token → load user → load sessions ──────────────────
  useEffect(() => {
    async function init() {
      // 1. Try to get current user — if access token valid this works immediately
      let user = null;
      try {
        user = await getCurrentUser();
      } catch { }

      // 2. If no user (access token expired), try silent refresh
      if (!user) {
        const refreshed = await silentRefresh();
        if (refreshed) {
          try {
            user = await getCurrentUser();
          } catch { }
        }
      }

      // 3. If still no user — not logged in
      if (!user) {
        setAuthError(true);
        setHydrated(true);
        return;
      }

      setUser({ id: user.id, name: user.name, email: user.email });

      // 4. Load sessions from DB
      // Filter out any PROCESSING sessions that are stuck
      // (page was refreshed mid-upload — these will never complete)
      try {
        const dbSessions = await getSessionsAction();
        const cleaned = dbSessions.map((s: any) => ({
          ...s,
          // If a session is PROCESSING after a page refresh it means
          // the upload was interrupted — mark it as ERROR in the UI
          status: s.status === "PROCESSING" ? "ERROR" : s.status,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
        setSessions(cleaned);
      } catch { }

      setHydrated(true);
    }

    init();
  }, []);

  async function onSessionClick(id: string) {
    if (id === activeSessionId) return;
    await loadSession(id);
  }

  async function onYouTubeSubmit() {
    if (!ytUrl.trim()) return;
    await handleYouTube(ytUrl.trim());
    setYtUrl("");
  }

  function onDeleteClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (deleteConfirm === id) {
      handleDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  }

  // ── Collapsed sidebar ─────────────────────────────────────────────────────
  if (sidebarCollapsed) {
    return (
      <aside className="sidebar sidebar--collapsed">
        <button
          className="collapse-btn"
          onClick={() => setSidebarCollapsed(false)}
          title="Expand sidebar"
        >›</button>
        <div className="collapsed-sessions">
          {sessions.map((s) => (
            <button
              key={s.id}
              className={`collapsed-dot ${s.id === activeSessionId ? "active" : ""}`}
              onClick={() => { onSessionClick(s.id); setSidebarCollapsed(false); }}
              title={s.title}
            />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <span className="logo-mark">SL</span>
        <span className="logo-text">StudyLens</span>
        <button className="collapse-btn" onClick={() => setSidebarCollapsed(true)}>‹</button>
      </div>

      {/* Add session */}
      <div className="add-session">
        <div className="source-tabs">
          <button
            className={`source-tab ${tab === "upload" ? "active" : ""}`}
            onClick={() => setTab("upload")}
          >⬆ Upload</button>
          <button
            className={`source-tab ${tab === "youtube" ? "active" : ""}`}
            onClick={() => setTab("youtube")}
          >▶ YouTube</button>
        </div>

        {tab === "upload" ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <button
              className="add-btn"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Processing…" : "+ Add Video"}
            </button>
          </>
        ) : (
          <div className="yt-input-row">
            <input
              className="yt-input"
              placeholder="Paste YouTube URL…"
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onYouTubeSubmit()}
              disabled={uploading}
            />
            <button
              className="yt-go"
              onClick={onYouTubeSubmit}
              disabled={uploading || !ytUrl.trim()}
            >
              {uploading ? "…" : "→"}
            </button>
          </div>
        )}

        {/* Error message */}
        {(error || authError) && (
          <p className="sidebar-error" onClick={() => { setError(""); setAuthError(false); }}>
            {authError ? "Session expired. Please log in again." : error} ×
          </p>
        )}
      </div>

      {/* Sessions label */}
      <div className="sessions-label">
        SESSIONS
        <span className="sessions-count">{sessions.length}</span>
      </div>

      {/* Sessions list */}
      <nav className="sessions-nav">
        {sessions.length === 0 && (
          <p className="sessions-empty">No sessions yet.<br />Add a video above.</p>
        )}

        {sessions.map((session) => (
          <div
            key={session.id}
            className={`session-item ${session.id === activeSessionId ? "active" : ""
              } status-${session.status.toLowerCase()}`}
            onClick={() => onSessionClick(session.id)}
          >
            <div className="session-icon">
              {session.status === "PROCESSING" ? (
                <span className="spin">⟳</span>
              ) : session.status === "ERROR" ? "⚠"
                : session.source === "YOUTUBE" ? "▶" : "🎬"}
            </div>
            <div className="session-info">
              <p className="session-title">{session.title}</p>
              <p className="session-meta">
                {formatDate(session.createdAt)}
                {session.duration ? ` · ${formatDuration(session.duration)}` : ""}
                {session.status === "READY" && (session as any).chapterCount
                  ? ` · ${(session as any).chapterCount} chapters`
                  : ""}
                {session.status === "PROCESSING" && " · Processing…"}
                {session.status === "ERROR" && " · Failed"}
              </p>
            </div>
            <button
              className={`session-delete ${deleteConfirm === session.id ? "confirm" : ""}`}
              onClick={(e) => onDeleteClick(e, session.id)}
              title={deleteConfirm === session.id ? "Click again to confirm" : "Remove session"}
            >
              {deleteConfirm === session.id ? "?" : "×"}
            </button>
          </div>
        ))}
      </nav>

      {/* Footer with UserMenu */}
      <div className="sidebar-footer">
        <UserMenu />
        <span className="footer-badge">Beta</span>
        <span className="footer-text">v1.0.0</span>
      </div>

    </aside>
  );
}
