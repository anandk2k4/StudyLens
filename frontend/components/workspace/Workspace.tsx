"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layout,
  FileText,
  StickyNote,
  Brain,
  FileCode,
  MessageSquare,
  Layers,
  BookMarked,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Database,
  Play,
  UploadCloud,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Loader2,
  Calendar,
} from "lucide-react";
import { useStore, SessionFull, isTerminalStatus, ActiveTab } from "@/lib/store";
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
import { TutorTab } from "@/components/tabs/TutorTab";
import { RevisionTab } from "@/components/tabs/RevisionTab";

const TABS: { id: ActiveTab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: Layout },
  { id: "summary", label: "Summary", icon: FileText },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "chapters", label: "Chapters", icon: BookMarked },
  { id: "quiz", label: "Quiz", icon: Brain },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "tutor", label: "AI Tutor", icon: GraduationCap },
  { id: "revision", label: "Revision", icon: Sparkles },
  { id: "transcript", label: "Transcript", icon: FileCode },
];

function formatTime(sec?: number | null) {
  if (!sec) return "0:00";
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function Workspace() {
  const {
    activeTab,
    setActiveTab,
    activeSessionFull,
    activeSessionId,
    sessions,
    setActiveView,
  } = useStore();

  const session: SessionFull | null = activeSessionFull;
  const sessionMeta = sessions.find((s) => s.id === activeSessionId) ?? null;
  const playerRef = useRef<VideoPlayerHandle>(null);
  const [currentTime, setCurrentTime] = useState(0);

  function seekTo(t: number) {
    playerRef.current?.seekTo(t);
  }

  if (!activeSessionId) return <EmptyState />;

  if (!session) {
    const status = sessionMeta?.status ?? "PROCESSING";
    if (status === "ERROR") {
      return (
        <div className="error-state">
          <AlertCircle className="h-10 w-10 text-[#FF3347]" />
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
        <AlertCircle className="h-10 w-10 text-[#FF3347]" />
        <h2>Processing Failed</h2>
        <p>{session.errorMessage ?? "Remove this session and try again."}</p>
      </div>
    );
  }

  if (!isTerminalStatus(session.status)) {
    return <ProcessingIndicator status={session.status} />;
  }

  const isCompleted = session.status === "READY";
  const chapterCount = Array.isArray(session.chapters) ? session.chapters.length : 0;
  const quizCount = Array.isArray(session.quiz) ? session.quiz.length : 0;
  const flashcardCount = Array.isArray(session.flashcards) ? session.flashcards.length : 0;
  const notesCount = session.notes ? (session.notes.match(/[-*•]/g)?.length || 8) : 0;

  return (
    <div className="workspace flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#05090B]">
      {/* Workspace Top Header (Screen 6 Mockup) */}
      <div className="workspace-header border-b border-[#1A2830] bg-[#0A1014] px-6 py-4 flex-shrink-0">
        <div className="flex flex-col gap-3">
          {/* Back button */}
          <button
            onClick={() => setActiveView("library")}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#8B9A9D] hover:text-[#00D9C0] transition-colors w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>My Library</span>
          </button>

          {/* Title Row & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-[#F5F7F7] tracking-tight">
                  {session.title}
                </h1>
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1 bg-[#00D9C0]/10 border border-[#00D9C0]/30 text-[#00D9C0] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-[#FF3347]/10 border border-[#FF3347]/30 text-[#FF3347] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-[#8B9A9D] font-mono">
                <span>{formatTime(session.duration)}</span>
                <span>·</span>
                <span>Uploaded {formatDate(session.createdAt)}</span>
                <span>·</span>
                <span className="capitalize">{session.source.toLowerCase()}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("tutor")}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#00D9C0]/40 bg-[#00D9C0]/10 text-[#00D9C0] hover:bg-[#00D9C0]/20 font-medium text-xs md:text-sm transition-all shadow-sm"
              >
                <GraduationCap className="h-4 w-4" />
                <span>Ask AI Tutor</span>
              </button>

              <button
                onClick={() => setActiveTab("revision")}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#FF3347]/40 bg-[#FF3347]/10 text-[#FF3347] hover:bg-[#FF3347]/20 font-medium text-xs md:text-sm transition-all shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                <span>Revision</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Sub-Tab Bar */}
      <div className="tab-bar bg-[#0A1014] border-b border-[#1A2830] px-6 py-1 flex gap-2 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`tab-btn relative flex items-center gap-2 px-3.5 py-2.5 text-xs md:text-sm font-medium transition-colors ${
                isActive ? "text-[#00D9C0]" : "text-[#8B9A9D] hover:text-[#F5F7F7]"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00D9C0]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Panel / Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" ? (
          /* Overview Tab: Video Player + Lecture Overview Card (Screen 6 Mockup) */
          <div className="p-6 md:p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Video Player */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-[#1A2830] bg-black shadow-2xl">
                {session.videoUrl ? (
                  <VideoPlayer
                    ref={playerRef}
                    src={session.videoUrl}
                    onTimeUpdate={setCurrentTime}
                  />
                ) : (
                  <div className="w-full h-80 flex flex-col items-center justify-center gap-3 text-[#4A5B62]">
                    <Play className="h-12 w-12 text-[#FF3347] fill-[#FF3347]" />
                    <p className="text-sm">Video stream preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 Columns: Lecture Overview Card */}
            <div className="lg:col-span-5 bg-[#0D1519] border border-[#1A2830] rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#F5F7F7]">Lecture Overview</h3>
                <p className="text-[#8B9A9D] text-sm mt-2 leading-relaxed">
                  {session.summary
                    ? session.summary.slice(0, 320) + (session.summary.length > 320 ? "…" : "")
                    : "This lecture covers the fundamental concepts, structured notes, key formulas, and self-test practice items extracted from the video content."}
                </p>
              </div>

              {/* Stats Breakdown */}
              <div className="space-y-3 pt-2 border-t border-[#1A2830]">
                <div className="flex items-center justify-between text-sm py-1.5 border-b border-[#1A2830]/50">
                  <span className="flex items-center gap-2 text-[#8B9A9D]">
                    <Clock className="h-4 w-4 text-[#00D9C0]" />
                    Duration
                  </span>
                  <span className="font-mono text-[#F5F7F7] font-semibold">
                    {formatTime(session.duration)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-[#1A2830]/50">
                  <span className="flex items-center gap-2 text-[#8B9A9D]">
                    <BookMarked className="h-4 w-4 text-[#00D9C0]" />
                    Chapters
                  </span>
                  <span className="font-mono text-[#F5F7F7] font-semibold">{chapterCount}</span>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-[#1A2830]/50">
                  <span className="flex items-center gap-2 text-[#8B9A9D]">
                    <StickyNote className="h-4 w-4 text-[#00D9C0]" />
                    Notes Sections
                  </span>
                  <span className="font-mono text-[#F5F7F7] font-semibold">{notesCount}</span>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-[#1A2830]/50">
                  <span className="flex items-center gap-2 text-[#8B9A9D]">
                    <Layers className="h-4 w-4 text-[#00D9C0]" />
                    Flashcards
                  </span>
                  <span className="font-mono text-[#F5F7F7] font-semibold">{flashcardCount}</span>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5">
                  <span className="flex items-center gap-2 text-[#8B9A9D]">
                    <Brain className="h-4 w-4 text-[#00D9C0]" />
                    Quiz Questions
                  </span>
                  <span className="font-mono text-[#F5F7F7] font-semibold">{quizCount}</span>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab("summary")}
                  className="bg-[#111A1F] hover:bg-[#152025] border border-[#1A2830] text-[#F5F7F7] py-2 px-3 rounded-lg text-xs font-medium text-center transition-colors"
                >
                  Read Summary
                </button>
                <button
                  onClick={() => setActiveTab("quiz")}
                  className="bg-[#00D9C0]/10 hover:bg-[#00D9C0]/20 border border-[#00D9C0]/30 text-[#00D9C0] py-2 px-3 rounded-lg text-xs font-semibold text-center transition-colors"
                >
                  Take Quiz
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Other Tabs: Summary, Notes, Chapters, Quiz, Flashcards, Tutor, Revision, Transcript */
          <div className="p-6 md:p-8 max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
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
                    videoId={session.videoId ?? session.id}
                    onSeek={seekTo}
                  />
                )}
                {activeTab === "chat" && (
                  <ChatTab
                    videoId={session.videoId ?? session.id}
                    onSeek={seekTo}
                  />
                )}
                {activeTab === "flashcards" && (
                  <FlashcardsTab flashcards={session.flashcards} />
                )}
                {activeTab === "chapters" && (
                  <ChaptersTab
                    chapters={session.chapters}
                    currentTime={currentTime}
                    onSeek={seekTo}
                  />
                )}
                {activeTab === "tutor" && (
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
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}