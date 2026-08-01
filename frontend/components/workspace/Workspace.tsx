"use client";

import { useRef, useState } from "react";
import { useStore, SessionFull, isTerminalStatus } from "@/lib/store";
import { VideoPlayer, VideoPlayerHandle } from "./VideoPlayer";
import { EmptyState } from "./EmptyState";
import { ProcessingIndicator } from "./ProcessingIndicator";
import { SummaryTab } from "@/components/tabs/SummaryTab";
import { NotesTab } from "@/components/tabs/NotesTab";
import { QuizTab } from "@/components/tabs/QuizTab";
import { TranscriptTab } from "@/components/tabs/TranscriptTab";
import { ChatTab } from "@/components/tabs/ChatTab";
import { FlashcardsTab } from "@/components/tabs/FlashcardsTab";
import { ChaptersTab } from "@/components/tabs/ChaptersTab";
import { TutorTab } from "@/components/tabs/TutorTab";   // ← NEW
import { RevisionTab } from "@/components/tabs/RevisionTab";

const TABS = [
  { id: "summary", label: "Summary", icon: "📄" },
  { id: "notes", label: "Notes", icon: "📝" },
  { id: "quiz", label: "Quiz", icon: "🧠" },
  { id: "transcript", label: "Transcript", icon: "🔍" },
  { id: "chat", label: "Ask AI", icon: "💬" },
  { id: "flashcards", label: "Flashcards", icon: "🃏" },
  { id: "chapters", label: "Chapters", icon: "📖" },
  { id: "tutor", label: "Tutor", icon: "📚" },
  { id: "revision", label: "Revision", icon: "⭐" },      // ← NEW
] as const;

export function Workspace() {
  const {
    activeTab, setActiveTab,
    activeSessionFull, activeSessionId, sessions,
  } = useStore();

  const session: SessionFull | null = activeSessionFull;
  const sessionMeta = sessions.find((s) => s.id === activeSessionId) ?? null;
  const playerRef = useRef<VideoPlayerHandle>(null);
  const [currentTime, setCurrentTime] = useState(0);

  function seekTo(t: number) { playerRef.current?.seekTo(t); }

  if (!activeSessionId) return <EmptyState />;

  if (!session) {
    const status = sessionMeta?.status ?? "PROCESSING";
    if (status === "ERROR") {
      return (
        <div className="error-state">
          <div className="error-icon">⚠</div>
          <h2>Processing Failed</h2>
          <p>{sessionMeta?.errorMessage ?? "Remove this session and try again."}</p>
        </div>
      );
    }
    return <ProcessingIndicator status={status} />;
  }

  if (session.status === "ERROR") {
    return (
      <div className="error-state">
        <div className="error-icon">⚠</div>
        <h2>Processing Failed</h2>
        <p>{session.errorMessage ?? "Remove this session and try again."}</p>
      </div>
    );
  }

  if (!isTerminalStatus(session.status)) {
    return <ProcessingIndicator status={session.status} />;
  }

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
        <VideoPlayer ref={playerRef} src={session.videoUrl} onTimeUpdate={setCurrentTime} />
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
        {activeTab === "summary" && session.summary && <SummaryTab summary={session.summary} />}
        {activeTab === "notes" && session.notes && <NotesTab notes={session.notes} />}
        {activeTab === "quiz" && session.quiz && <QuizTab quiz={session.quiz} />}
        {activeTab === "transcript" && session.segments && (
          <TranscriptTab segments={session.segments} videoId={session.videoId ?? session.id} onSeek={seekTo} />
        )}
        {activeTab === "chat" && (
          <ChatTab videoId={session.videoId ?? session.id} onSeek={seekTo} />
        )}
        {activeTab === "flashcards" && <FlashcardsTab flashcards={session.flashcards} />}
        {activeTab === "chapters" && (
          <ChaptersTab chapters={session.chapters} currentTime={currentTime} onSeek={seekTo} />
        )}
        {activeTab === "tutor" && (                                          // ← tutor tab
          <TutorTab
            sessionId={session.id}
            chapters={session.chapters}
            segments={session.segments}
            onSeek={seekTo}
          />
        )}

        {activeTab === "revision" && (
          <RevisionTab
            sessionId={session.id}
            userId={(session as any).userId ?? ""}
            title={session.title}
            summary={session.summary}
            notes={session.notes}
            chapters={session.chapters}
            quiz={session.quiz}
            flashcards={session.flashcards}
            cachedRevision={session.revision}
          />
        )}
      </div>
    </div>
  );
}