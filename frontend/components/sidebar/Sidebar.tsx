"use client";

import { useRef, useState } from "react";
import { useStore, useActiveSession } from "@/store/useStore";
import { Session } from "@/types";
import { uploadVideo, downloadYouTube } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDuration(sec?: number) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Sidebar() {
  const {
    sessions,
    activeSessionId,
    sidebarCollapsed,
    addSession,
    updateSession,
    removeSession,
    setActiveSession,
    setSidebarCollapsed,
  } = useStore();

  const [tab, setTab] = useState<"upload" | "youtube">("upload");
  const [ytUrl, setYtUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    const tempId = uuidv4();
    const placeholder: Session = {
      id: tempId,
      title: file.name.replace(/\.[^.]+$/, ""),
      source: "upload",
      createdAt: new Date().toISOString(),
      status: "processing",
    };
    addSession(placeholder);
    setActiveSession(tempId);
    setLoading(true);
    try {
      const data = await uploadVideo(file);
      updateSession(tempId, {
        id: data.video_id,
        title: data.filename || placeholder.title,
        status: "ready",
        videoUrl: data.video_url,
        transcript: data.transcript,
        segments: data.segments,
        summary: data.summary,
        notes: data.notes,
        quiz: data.quiz,
        duration: data.segments?.at(-1)?.end,
      });
      // Fix activeSessionId to real id
      useStore.setState((s) => ({
        sessions: s.sessions.map((sess) =>
          sess.id === tempId ? { ...sess, id: data.video_id } : sess
        ),
        activeSessionId: data.video_id,
      }));
    } catch (e: any) {
      updateSession(tempId, { status: "error" });
      setError(e?.response?.data?.detail?.message ?? "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleYouTube() {
    if (!ytUrl.trim()) return;
    setError("");
    const tempId = uuidv4();
    const placeholder: Session = {
      id: tempId,
      title: "Fetching YouTube video…",
      source: "youtube",
      createdAt: new Date().toISOString(),
      status: "processing",
    };
    addSession(placeholder);
    setActiveSession(tempId);
    setLoading(true);
    try {
      const data = await downloadYouTube(ytUrl.trim());
      updateSession(tempId, {
        id: data.video_id,
        title: data.filename,
        status: "ready",
        videoUrl: data.video_url,
        transcript: data.transcript,
        segments: data.segments,
        summary: data.summary,
        notes: data.notes,
        quiz: data.quiz,
        duration: data.segments?.at(-1)?.end,
      });
      useStore.setState((s) => ({
        sessions: s.sessions.map((sess) =>
          sess.id === tempId ? { ...sess, id: data.video_id } : sess
        ),
        activeSessionId: data.video_id,
      }));
      setYtUrl("");
    } catch (e: any) {
      updateSession(tempId, { status: "error" });
      setError(e?.response?.data?.detail?.message ?? "YouTube download failed.");
    } finally {
      setLoading(false);
    }
  }

  if (sidebarCollapsed) {
    return (
      <aside className="sidebar sidebar--collapsed">
        <button
          className="collapse-btn"
          onClick={() => setSidebarCollapsed(false)}
          title="Expand sidebar"
        >
          ›
        </button>
        <div className="collapsed-sessions">
          {sessions.map((s) => (
            <button
              key={s.id}
              className={`collapsed-dot ${s.id === activeSessionId ? "active" : ""}`}
              onClick={() => { setActiveSession(s.id); setSidebarCollapsed(false); }}
              title={s.title}
            />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <span className="logo-mark">SL</span>
        <span className="logo-text">StudyLens</span>
        <button
          className="collapse-btn"
          onClick={() => setSidebarCollapsed(true)}
          title="Collapse sidebar"
        >
          ‹
        </button>
      </div>

      {/* ── Add session ── */}
      <div className="add-session">
        <div className="source-tabs">
          <button
            className={`source-tab ${tab === "upload" ? "active" : ""}`}
            onClick={() => setTab("upload")}
          >
            ⬆ Upload
          </button>
          <button
            className={`source-tab ${tab === "youtube" ? "active" : ""}`}
            onClick={() => setTab("youtube")}
          >
            ▶ YouTube
          </button>
        </div>

        {tab === "upload" ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <button
              className="add-btn"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
            >
              {loading ? "Processing…" : "+ Add Video"}
            </button>
          </>
        ) : (
          <div className="yt-input-row">
            <input
              className="yt-input"
              placeholder="Paste YouTube URL…"
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleYouTube()}
              disabled={loading}
            />
            <button
              className="yt-go"
              onClick={handleYouTube}
              disabled={loading || !ytUrl.trim()}
            >
              {loading ? "…" : "→"}
            </button>
          </div>
        )}

        {error && <p className="sidebar-error">{error}</p>}
      </div>

      {/* ── Sessions list ── */}
      <div className="sessions-label">
        SESSIONS
        <span className="sessions-count">{sessions.length}</span>
      </div>

      <nav className="sessions-nav">
        {sessions.length === 0 && (
          <p className="sessions-empty">No sessions yet.<br />Add a video above.</p>
        )}
        {sessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            isActive={session.id === activeSessionId}
            onSelect={() => setActiveSession(session.id)}
            onDelete={() => {
              if (deleteConfirm === session.id) {
                removeSession(session.id);
                setDeleteConfirm(null);
              } else {
                setDeleteConfirm(session.id);
                setTimeout(() => setDeleteConfirm(null), 3000);
              }
            }}
            deleteConfirm={deleteConfirm === session.id}
          />
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <span className="footer-badge">Beta</span>
        <span className="footer-text">v1.0.0</span>
      </div>
    </aside>
  );
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  deleteConfirm,
}: {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  deleteConfirm: boolean;
}) {
  return (
    <div
      className={`session-item ${isActive ? "active" : ""} status-${session.status}`}
      onClick={onSelect}
    >
      <div className="session-icon">
        {session.status === "processing" ? (
          <span className="spin">⟳</span>
        ) : session.status === "error" ? (
          "⚠"
        ) : session.source === "youtube" ? (
          "▶"
        ) : (
          "🎬"
        )}
      </div>
      <div className="session-info">
        <p className="session-title">{session.title}</p>
        <p className="session-meta">
          {formatDate(session.createdAt)}
          {session.duration ? ` · ${formatDuration(session.duration)}` : ""}
          {session.status === "processing" ? " · Processing…" : ""}
          {session.status === "error" ? " · Error" : ""}
        </p>
      </div>
      <button
        className={`session-delete ${deleteConfirm ? "confirm" : ""}`}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title={deleteConfirm ? "Click again to confirm" : "Remove session"}
      >
        {deleteConfirm ? "?" : "×"}
      </button>
    </div>
  );
}