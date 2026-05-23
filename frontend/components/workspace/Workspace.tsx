"use client";

import { useRef } from "react";
import { useStore, useActiveSession } from "@/store/useStore";
import { ActiveTab } from "@/types";
import { VideoPlayer, VideoPlayerHandle } from "./VideoPlayer";
import { EmptyState } from "./EmptyState";
import { SummaryTab } from "@/components/tabs/SummaryTab";
import { NotesTab } from "@/components/tabs/NotesTab";
import { QuizTab } from "@/components/tabs/QuizTab";
import { TranscriptTab } from "@/components/tabs/TranscriptTab";
import { ChatTab } from "@/components/tabs/ChatTab";

const TABS: { id: ActiveTab; label: string; icon: string }[] = [
  { id: "summary",    label: "Summary",    icon: "📄" },
  { id: "notes",      label: "Notes",      icon: "📝" },
  { id: "quiz",       label: "Quiz",       icon: "🧠" },
  { id: "transcript", label: "Transcript", icon: "🔍" },
  { id: "chat",       label: "Ask AI",     icon: "💬" },
];

export function Workspace() {
  const { activeTab, setActiveTab } = useStore();
  const session = useActiveSession();
  const playerRef = useRef<VideoPlayerHandle>(null);

  function seekTo(t: number) {
    playerRef.current?.seekTo(t);
  }

  if (!session) return <EmptyState />;

  if (session.status === "processing") {
    return (
      <div className="processing-state">
        <div className="proc-spinner">⟳</div>
        <h2 className="proc-title">Processing Video</h2>
        <p className="proc-sub">
          Transcribing with Whisper · Generating summaries, notes &amp; quiz…
        </p>
        <div className="proc-bar"><div className="proc-fill" /></div>
      </div>
    );
  }

  if (session.status === "error") {
    return (
      <div className="error-state">
        <div className="error-icon">⚠</div>
        <h2>Processing Failed</h2>
        <p>This session encountered an error. Try removing it and re-uploading.</p>
      </div>
    );
  }

  return (
    <div className="workspace">
      {/* ── Header ── */}
      <div className="workspace-header">
        <div className="ws-title-row">
          <span className="ws-source-badge">
            {session.source === "youtube" ? "▶ YouTube" : "🎬 Upload"}
          </span>
          <h1 className="ws-title">{session.title}</h1>
        </div>
      </div>

      {/* ── Video ── */}
      {session.videoUrl && (
        <VideoPlayer ref={playerRef} src={session.videoUrl} />
      )}

      {/* ── Tab bar ── */}
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

      {/* ── Tab content ── */}
      <div className="tab-panel">
        {activeTab === "summary" && session.summary && (
          <SummaryTab summary={session.summary} />
        )}
        {activeTab === "notes" && session.notes && (
          <NotesTab notes={session.notes} />
        )}
        {activeTab === "quiz" && session.quiz && (
          <QuizTab quiz={session.quiz} />
        )}
        {activeTab === "transcript" && session.segments && (
          <TranscriptTab
            segments={session.segments}
            videoId={session.id}
            onSeek={seekTo}
          />
        )}
        {activeTab === "chat" && (
          <ChatTab videoId={session.id} onSeek={seekTo} />
        )}
      </div>
    </div>
  );
}