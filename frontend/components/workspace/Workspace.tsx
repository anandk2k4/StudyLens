"use client";

import { useRef } from "react";
import { useStore, SessionFull, isTerminalStatus } from "@/lib/store";
import { VideoPlayer, VideoPlayerHandle } from "./VideoPlayer";
import { EmptyState } from "./EmptyState";
import { ProcessingIndicator } from "./ProcessingIndicator";   // ← now used
import { SummaryTab }    from "@/components/tabs/SummaryTab";
import { NotesTab }      from "@/components/tabs/NotesTab";
import { QuizTab }       from "@/components/tabs/QuizTab";
import { TranscriptTab } from "@/components/tabs/TranscriptTab";
import { ChatTab }       from "@/components/tabs/ChatTab";
import { FlashcardsTab } from "@/components/tabs/FlashcardsTab";

const TABS = [
  { id: "summary",    label: "Summary",    icon: "📄" },
  { id: "notes",      label: "Notes",      icon: "📝" },
  { id: "quiz",       label: "Quiz",       icon: "🧠" },
  { id: "transcript", label: "Transcript", icon: "🔍" },
  { id: "chat",       label: "Ask AI",     icon: "💬" },
  { id: "flashcards", label: "Flashcards", icon: "🃏" },
] as const;

export function Workspace() {
  const {
    activeTab,
    setActiveTab,
    activeSessionFull,
    activeSessionId,
    sessions,
  } = useStore();

  const session: SessionFull | null = activeSessionFull;
  const sessionMeta = sessions.find((s) => s.id === activeSessionId) ?? null;
  const playerRef   = useRef<VideoPlayerHandle>(null);

  function seekTo(t: number) { playerRef.current?.seekTo(t); }

  // ── No session selected ───────────────────────────────────────────────────
  if (!activeSessionId) return <EmptyState />;

  // ── Full data not loaded yet — use sessionMeta for status display ─────────
  if (!session) {
    const status = sessionMeta?.status ?? "PROCESSING";

    if (status === "ERROR") {
      return (
        <div className="error-state">
          <div className="error-icon">⚠</div>
          <h2>Processing Failed</h2>
          <p>
            {sessionMeta?.errorMessage ?? "Remove this session and try again."}
          </p>
        </div>
      );
    }

    // Still processing — show stage-aware indicator
    return <ProcessingIndicator status={status} />;
  }

  // ── Terminal error state ──────────────────────────────────────────────────
  if (session.status === "ERROR") {
    return (
      <div className="error-state">
        <div className="error-icon">⚠</div>
        <h2>Processing Failed</h2>
        <p>{session.errorMessage ?? "Remove this session and try again."}</p>
      </div>
    );
  }

  // ── Still processing (full session loaded but not READY yet) ─────────────
  if (!isTerminalStatus(session.status)) {
    return <ProcessingIndicator status={session.status} />;
  }

  // ── READY — render full workspace ─────────────────────────────────────────
  return (
    <div className="workspace">
      <div className="workspace-header">
        <div className="ws-title-row">
          <span className="ws-source-badge">
            {session.source === "YOUTUBE" ? "▶ YouTube" : "🎬 Upload"}
          </span>
          <h1 className="ws-title">{session.title}</h1>
        </div>
      </div>

      {session.videoUrl && (
        <VideoPlayer ref={playerRef} src={session.videoUrl} />
      )}

      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {activeTab === "summary"    && session.summary    && (
          <SummaryTab summary={session.summary} />
        )}
        {activeTab === "notes"      && session.notes      && (
          <NotesTab notes={session.notes} />
        )}
        {activeTab === "quiz"       && session.quiz       && (
          <QuizTab quiz={session.quiz} />
        )}
        {activeTab === "transcript" && session.segments   && (
          <TranscriptTab
            segments={session.segments}
            videoId={session.videoId ?? session.id}
            onSeek={seekTo}
          />
        )}
        {activeTab === "chat" && (
          <ChatTab videoId={session.videoId ?? session.id} onSeek={seekTo} />
        )}
        {activeTab === "flashcards" && (
          <FlashcardsTab flashcards={session.flashcards} />
        )}
      </div>
    </div>
  );
}