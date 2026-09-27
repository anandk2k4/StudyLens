"use client";

import { useState, useRef } from "react";
import {
  Search,
  Plus,
  Play,
  FileVideo,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  StickyNote,
  Brain,
  Layers,
  Trash2,
  UploadCloud,
  ArrowRight,
} from "lucide-react";
import { useStore, SessionMeta } from "@/lib/store";
import { useSession } from "@/hooks/useSession";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(sec?: number | null) {
  if (!sec) return "0:00";
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }
  return `${mins} min`;
}

export function LibraryView() {
  const { sessions, setActiveSession, setActiveView } = useStore();
  const { handleUpload, handleYouTube, loadSession, handleDelete, uploading, error } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PROCESSING" | "COMPLETED">("ALL");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [showYtInput, setShowYtInput] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const processingCount = sessions.filter(
    (s) => s.status !== "READY" && s.status !== "ERROR"
  ).length;
  const completedCount = sessions.filter((s) => s.status === "READY").length;

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === "PROCESSING") {
      return session.status !== "READY" && session.status !== "ERROR";
    }
    if (activeFilter === "COMPLETED") {
      return session.status === "READY";
    }
    return true;
  });

  async function onOpenLecture(sessionId: string) {
    await loadSession(sessionId);
    setActiveView("workspace");
  }

  async function onYouTubeSubmit() {
    if (!ytUrl.trim()) return;
    await handleYouTube(ytUrl.trim());
    setYtUrl("");
    setShowYtInput(false);
    setShowAddMenu(false);
  }

  function onDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (deleteConfirmId === id) {
      handleDelete(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3500);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#05090B]">
      <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F7F7]">My Library</h1>
            <p className="text-[#8B9A9D] mt-1 text-sm">
              Manage all your lectures and learning materials.
            </p>
          </div>

          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B9A9D]" />
              <input
                type="text"
                placeholder="Search your lectures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 h-10 bg-[#0D1519] border border-[#1A2830] rounded-lg text-sm text-[#F5F7F7] placeholder:text-[#4A5B62] focus:outline-none focus:border-[#00D9C0] transition-colors w-60 md:w-72"
              />
            </div>

            {/* Add Lecture Button & Dropdown */}
            <div className="relative flex items-center">
              <button
                onClick={() => setShowAddMenu((v) => !v)}
                disabled={uploading}
                className="flex items-center justify-center gap-2 bg-[#00D9C0] hover:bg-[#00B09D] text-[#05090B] font-semibold h-10 px-4 rounded-lg transition-colors text-sm shadow-md shadow-[#00D9C0]/20 disabled:opacity-70"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Add Lecture</span>
              </button>

              {showAddMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => {
                      setShowAddMenu(false);
                      setShowYtInput(false);
                    }}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#0A1014] border border-[#1A2830] rounded-xl shadow-2xl p-2 z-40 space-y-1">
                    <button
                      onClick={() => {
                        setShowAddMenu(false);
                        fileRef.current?.click();
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#F5F7F7] hover:bg-[#152025] rounded-lg transition-colors"
                    >
                      <UploadCloud className="h-4 w-4 text-[#00D9C0]" />
                      <span>Upload Video File</span>
                    </button>

                    <button
                      onClick={() => setShowYtInput(true)}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[#F5F7F7] hover:bg-[#152025] rounded-lg transition-colors"
                    >
                      <Play className="h-4 w-4 text-[#FF3347] fill-[#FF3347]" />
                      <span>Import from YouTube</span>
                    </button>

                    {showYtInput && (
                      <div className="p-2 border-t border-[#1A2830] mt-1 space-y-2">
                        <input
                          type="text"
                          placeholder="Paste YouTube link..."
                          value={ytUrl}
                          onChange={(e) => setYtUrl(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && onYouTubeSubmit()}
                          className="w-full bg-[#05090B] border border-[#1A2830] text-xs px-2.5 py-1.5 rounded text-[#F5F7F7] focus:outline-none focus:border-[#00D9C0]"
                        />
                        <button
                          onClick={onYouTubeSubmit}
                          disabled={!ytUrl.trim()}
                          className="w-full bg-[#00D9C0] hover:bg-[#00B09D] text-[#05090B] font-semibold text-xs py-1.5 rounded transition-colors disabled:opacity-50"
                        >
                          Import Video
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="video/*,audio/*"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
          </div>
        </header>

        {error && (
          <div className="bg-[#FF3347]/10 border border-[#FF3347]/20 rounded-xl p-4 flex items-center gap-3 text-[#FF3347]">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1A2830] pb-4">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              activeFilter === "ALL"
                ? "bg-[rgba(0,217,192,0.12)] text-[#00D9C0] border border-[#00D9C0]/40"
                : "text-[#8B9A9D] hover:bg-[#152025] hover:text-[#F5F7F7]"
            }`}
          >
            All ({sessions.length})
          </button>
          <button
            onClick={() => setActiveFilter("PROCESSING")}
            className={`px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              activeFilter === "PROCESSING"
                ? "bg-[rgba(0,217,192,0.12)] text-[#00D9C0] border border-[#00D9C0]/40"
                : "text-[#8B9A9D] hover:bg-[#152025] hover:text-[#F5F7F7]"
            }`}
          >
            Processing ({processingCount})
          </button>
          <button
            onClick={() => setActiveFilter("COMPLETED")}
            className={`px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              activeFilter === "COMPLETED"
                ? "bg-[rgba(0,217,192,0.12)] text-[#00D9C0] border border-[#00D9C0]/40"
                : "text-[#8B9A9D] hover:bg-[#152025] hover:text-[#F5F7F7]"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Lectures Grid */}
        {filteredSessions.length === 0 ? (
          <div className="bg-[#0D1519] border border-[#1A2830] rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto mt-8">
            <div className="w-16 h-16 rounded-full bg-[#152025] flex items-center justify-center text-[#00D9C0]">
              <FileVideo className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-[#F5F7F7]">No lectures found</h3>
            <p className="text-[#8B9A9D] text-sm max-w-sm">
              {searchQuery
                ? "Try searching with a different term."
                : "Upload a video lecture or paste a YouTube link to get started."}
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 bg-[#00D9C0] hover:bg-[#00B09D] text-[#05090B] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors mt-2"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload Your First Lecture</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((session) => {
              const isProcessing = session.status !== "READY" && session.status !== "ERROR";
              const isError = session.status === "ERROR";

              return (
                <div
                  key={session.id}
                  onClick={() => onOpenLecture(session.id)}
                  className="group bg-[#0D1519] border border-[#1A2830] hover:border-[#00D9C0]/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-[#111A1F] flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-black/40"
                >
                  {/* Card Header & Preview */}
                  <div className="space-y-3">
                    <div className="w-full h-36 bg-[#05090B] rounded-lg border border-[#1A2830] flex items-center justify-center relative overflow-hidden group-hover:border-[#00D9C0]/30 transition-colors">
                      {session.thumbnail ? (
                        <img
                          src={session.thumbnail}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-[#4A5B62]">
                          {session.source === "YOUTUBE" ? (
                            <Play className="h-10 w-10 text-[#FF3347] fill-[#FF3347] opacity-80" />
                          ) : (
                            <FileVideo className="h-10 w-10 text-[#00D9C0] opacity-80" />
                          )}
                        </div>
                      )}

                      {/* Source Badge */}
                      <div className="absolute top-2 left-2">
                        {session.source === "YOUTUBE" ? (
                          <span className="bg-black/80 backdrop-blur-sm text-[#FF3347] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#FF3347]/30 flex items-center gap-1">
                            <Play className="h-2.5 w-2.5 fill-current" />
                            YouTube
                          </span>
                        ) : (
                          <span className="bg-black/80 backdrop-blur-sm text-[#00D9C0] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#00D9C0]/30 flex items-center gap-1">
                            <UploadCloud className="h-2.5 w-2.5" />
                            Upload
                          </span>
                        )}
                      </div>

                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-mono text-white border border-white/10">
                        {formatDuration(session.duration)}
                      </div>
                    </div>

                    {/* Title & Metadata */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-[#F5F7F7] text-base line-clamp-1 group-hover:text-[#00D9C0] transition-colors">
                          {session.title}
                        </h3>
                        <button
                          onClick={(e) => onDelete(e, session.id)}
                          className={`p-1 text-[#4A5B62] hover:text-[#FF3347] transition-colors rounded ${
                            deleteConfirmId === session.id ? "text-[#FF3347] bg-[#FF3347]/10" : ""
                          }`}
                          title={deleteConfirmId === session.id ? "Confirm delete" : "Delete lecture"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#8B9A9D] mt-1 font-mono">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(session.createdAt)}</span>
                        <span>·</span>
                        {isProcessing ? (
                          <span className="text-[#00D9C0] flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Processing
                          </span>
                        ) : isError ? (
                          <span className="text-[#FF3347] flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Failed
                          </span>
                        ) : (
                          <span className="text-[#00D9C0] flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Feature Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="inline-flex items-center gap-1 bg-[#111A1F] border border-[#1A2830] text-[#8B9A9D] text-[10px] px-2 py-0.5 rounded">
                        <FileText className="h-2.5 w-2.5 text-[#00D9C0]" />
                        Summary
                      </span>
                      <span className="inline-flex items-center gap-1 bg-[#111A1F] border border-[#1A2830] text-[#8B9A9D] text-[10px] px-2 py-0.5 rounded">
                        <StickyNote className="h-2.5 w-2.5 text-[#00D9C0]" />
                        Notes
                      </span>
                      <span className="inline-flex items-center gap-1 bg-[#111A1F] border border-[#1A2830] text-[#8B9A9D] text-[10px] px-2 py-0.5 rounded">
                        <Brain className="h-2.5 w-2.5 text-[#00D9C0]" />
                        Quiz
                      </span>
                      <span className="inline-flex items-center gap-1 bg-[#111A1F] border border-[#1A2830] text-[#8B9A9D] text-[10px] px-2 py-0.5 rounded">
                        <Layers className="h-2.5 w-2.5 text-[#00D9C0]" />
                        +1
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-3 border-t border-[#1A2830] flex items-center justify-between">
                    <span className="text-xs text-[#8B9A9D] group-hover:text-[#F5F7F7] transition-colors">
                      {isProcessing ? "Processing..." : "Ready to study"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLecture(session.id);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D9C0] group-hover:text-[#33E3D0] transition-colors"
                    >
                      <span>Open Lecture</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
