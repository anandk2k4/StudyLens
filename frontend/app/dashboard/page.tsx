"use client";

import { useState, useRef } from "react";
import {
  Search,
  Plus,
  UploadCloud,
  Play,
  FileVideo,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Workspace } from "@/components/workspace/Workspace";
import { LibraryView } from "@/components/library/LibraryView";
import { TutorView } from "@/components/tutor/TutorView";
import { RevisionView } from "@/components/revision/RevisionView";
import { useStore } from "@/lib/store";
import { useSession } from "@/hooks/useSession";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDuration(sec?: number | null) {
  if (!sec) return "";
  return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, "0")}`;
}

export default function DashboardPage() {
  const { activeSessionId, activeView, setActiveView, setActiveTab, user, sessions } = useStore();
  const { handleUpload, handleYouTube, loadSession, uploading, error } = useSession();

  const [ytUrl, setYtUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onYouTubeSubmit() {
    if (!ytUrl.trim()) return;
    await handleYouTube(ytUrl.trim());
    setYtUrl("");
  }

  async function onOpenLecture(sessionId: string) {
    await loadSession(sessionId);
    setActiveView("workspace");
  }

  // Render view based on activeView in store
  function renderMainContent() {
    if (activeView === "workspace" && activeSessionId) {
      return <Workspace />;
    }

    if (activeView === "library") {
      return <LibraryView />;
    }

    if (activeView === "tutor") {
      return <TutorView />;
    }

    if (activeView === "revision") {
      return <RevisionView />;
    }

    if (activeView === "flashcards") {
      if (activeSessionId) {
        return <Workspace />;
      }
      return <LibraryView />;
    }

    if (activeView === "ask-ai") {
      if (activeSessionId) {
        return <Workspace />;
      }
      return <TutorView />;
    }

    // Default: Dashboard Home (Screen 4 Mockup)
    const latestSession = sessions[0];

    return (
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#05090B]">
        <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-10">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#F5F7F7]">
                Good morning, {user?.name?.split(" ")[0] || "Student"} 👋
              </h1>
              <p className="text-[#8B9A9D] mt-1 text-sm">
                Continue learning from your lectures.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B9A9D]" />
                <input
                  type="text"
                  placeholder="Search lectures, topics..."
                  className="pl-9 pr-4 py-2 bg-[#0D1519] border border-[#1A2830] rounded-lg text-sm text-[#F5F7F7] placeholder:text-[#4A5B62] focus:outline-none focus:border-[#00D9C0] transition-colors w-60 md:w-64"
                />
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-[#00D9C0] hover:bg-[#00B09D] text-[#05090B] font-semibold py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-70 shadow-md shadow-[#00D9C0]/15"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Add Lecture</span>
              </button>
            </div>
          </header>

          {error && (
            <div className="bg-[#FF3347]/10 border border-[#FF3347]/20 rounded-xl p-4 flex items-center gap-3 text-[#FF3347]">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Upload CTA Card (Screen 4) */}
          <section className="bg-gradient-to-br from-[#0D1519] to-[#0A1014] border border-[#1A2830] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D9C0]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="flex-1 space-y-6 relative z-10 w-full">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-[#F5F7F7]">
                  Upload a lecture to get started
                </h2>
                <p className="text-[#8B9A9D] text-sm max-w-md">
                  Upload video or audio files, or paste a YouTube link. Our AI creates structured
                  knowledge, notes, quizzes, and an adaptive tutor automatically.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*,audio/*"
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 bg-[#FF3347] hover:bg-[#E62E40] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm disabled:opacity-70 shadow-lg shadow-[#FF3347]/20"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Video</span>
                </button>

                <div className="flex items-center bg-[#05090B] border border-[#1A2830] rounded-lg overflow-hidden focus-within:border-[#00D9C0] transition-colors flex-1 sm:max-w-xs">
                  <div className="pl-3 py-2 text-[#FF3347]">
                    <Play className="h-4 w-4 fill-current" />
                  </div>
                  <input
                    type="text"
                    placeholder="Paste YouTube Link"
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onYouTubeSubmit()}
                    disabled={uploading}
                    className="bg-transparent text-sm py-2 px-2 text-[#F5F7F7] placeholder:text-[#4A5B62] focus:outline-none w-full"
                  />
                  <button
                    onClick={onYouTubeSubmit}
                    disabled={uploading || !ytUrl.trim()}
                    className="pr-3 py-2 text-[#00D9C0] hover:text-[#F5F7F7] disabled:opacity-50 transition-colors text-sm font-semibold"
                  >
                    {uploading && ytUrl ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Go"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Visual placeholder for video thumbnail */}
            <div className="w-full md:w-64 h-36 md:h-40 bg-[#05090B] border border-[#1A2830] rounded-xl flex items-center justify-center relative z-10 overflow-hidden shadow-xl shadow-black/50 shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#111A1F] to-[#0A1014] opacity-50" />
              <div className="w-12 h-12 rounded-full bg-[#152025] flex items-center justify-center">
                <Play className="h-5 w-5 text-[#00D9C0] fill-[#00D9C0] translate-x-0.5" />
              </div>
            </div>
          </section>

          {/* Continue Learning (Screen 4) */}
          {latestSession && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-[#F5F7F7]">Continue Learning</h3>
              <div
                onClick={() => onOpenLecture(latestSession.id)}
                className="group bg-[#0D1519] border border-[#1A2830] hover:border-[#00D9C0]/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-[#111A1F] flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <div className="w-full sm:w-40 h-24 bg-[#05090B] rounded-lg border border-[#1A2830] flex items-center justify-center shrink-0 overflow-hidden relative">
                  {latestSession.thumbnail ? (
                    <img
                      src={latestSession.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileVideo className="h-8 w-8 text-[#4A5B62]" />
                  )}
                  <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                    {formatDuration(latestSession.duration) || "0:00"}
                  </div>
                </div>

                <div className="flex-1 min-w-0 w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-base text-[#F5F7F7] truncate group-hover:text-[#00D9C0] transition-colors">
                      {latestSession.title}
                    </h4>
                    <span className="hidden sm:inline-flex text-xs font-semibold text-[#00D9C0] group-hover:translate-x-1 transition-transform items-center gap-1">
                      Continue <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <p className="text-xs text-[#8B9A9D] flex items-center gap-2 font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Last studied {formatDate(latestSession.updatedAt)}</span>
                    {latestSession.source === "YOUTUBE" && (
                      <>
                        <span>·</span>
                        <span className="text-[#FF3347]">YouTube</span>
                      </>
                    )}
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-1.5 flex-1 bg-[#05090B] rounded-full overflow-hidden">
                      <div className="h-full bg-[#00D9C0] w-[72%]" />
                    </div>
                    <span className="text-xs font-mono text-[#00D9C0]">72%</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Recent Lectures (Screen 4) */}
          {sessions.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F5F7F7]">Recent Lectures</h3>
                <button
                  onClick={() => setActiveView("library")}
                  className="text-xs text-[#00D9C0] hover:underline font-semibold flex items-center gap-1"
                >
                  See all <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.slice(0, 6).map((session) => {
                  const isProcessing = session.status !== "READY" && session.status !== "ERROR";

                  return (
                    <div
                      key={session.id}
                      onClick={() => onOpenLecture(session.id)}
                      className="bg-[#0D1519] border border-[#1A2830] hover:border-[#00D9C0]/50 rounded-xl p-4 cursor-pointer transition-all hover:bg-[#111A1F] flex flex-col justify-between space-y-3 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#05090B] border border-[#1A2830] flex items-center justify-center shrink-0">
                          {session.source === "YOUTUBE" ? (
                            <Play className="h-4 w-4 text-[#FF3347] fill-[#FF3347]" />
                          ) : (
                            <FileVideo className="h-4 w-4 text-[#00D9C0]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-[#F5F7F7] truncate group-hover:text-[#00D9C0] transition-colors">
                            {session.title}
                          </h4>
                          <p className="text-xs text-[#8B9A9D] mt-0.5 font-mono">
                            {formatDuration(session.duration) || "0:00"} · {formatDate(session.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-[#1A2830]/50 text-xs">
                        <span className="text-[#8B9A9D] font-mono">
                          {session.source.toLowerCase()}
                        </span>

                        {isProcessing ? (
                          <span className="flex items-center gap-1 text-[#00D9C0] bg-[#00D9C0]/10 px-2 py-0.5 rounded-full border border-[#00D9C0]/20 font-semibold">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Processing
                          </span>
                        ) : session.status === "ERROR" ? (
                          <span className="flex items-center gap-1 text-[#FF3347] bg-[#FF3347]/10 px-2 py-0.5 rounded-full border border-[#FF3347]/20 font-semibold">
                            <AlertCircle className="h-3 w-3" />
                            Failed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[#00D9C0] bg-[#00D9C0]/10 px-2 py-0.5 rounded-full border border-[#00D9C0]/20 font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell bg-[#05090B] text-[#F5F7F7]">
      <Sidebar />
      <main className="main-content flex-1 flex flex-col min-w-0 overflow-hidden">
        {renderMainContent()}
      </main>
    </div>
  );
}