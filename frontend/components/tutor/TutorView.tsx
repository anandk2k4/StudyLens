"use client";

import { useState } from "react";
import { GraduationCap, ChevronDown, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useSession } from "@/hooks/useSession";
import { TutorTab } from "@/components/tabs/TutorTab";

export function TutorView() {
  const { sessions, activeSessionId, activeSessionFull, setActiveSession } = useStore();
  const { loadSession } = useSession();

  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentSession =
    activeSessionFull || sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;

  async function handleSelectSession(id: string) {
    setShowPicker(false);
    setLoading(true);
    try {
      await loadSession(id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#05090B]">
      {/* Top Header matching Screen 7 Mockup */}
      <div className="border-b border-[#1A2830] bg-[#0A1014] px-6 py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F7F7] flex items-center gap-2.5">
              <GraduationCap className="h-6 w-6 text-[#00D9C0]" />
              <span>AI Tutor</span>
            </h1>
            <p className="text-[#8B9A9D] text-sm mt-0.5">
              Ask anything about your lecture. Get instant, accurate answers.
            </p>
          </div>

          {/* Session Selector Dropdown */}
          {sessions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowPicker((v) => !v)}
                className="flex items-center gap-2.5 bg-[#0D1519] border border-[#1A2830] hover:border-[#00D9C0]/50 rounded-xl px-4 py-2 text-sm text-[#F5F7F7] transition-all"
              >
                <BookOpen className="h-4 w-4 text-[#00D9C0]" />
                <span className="font-medium max-w-[200px] truncate">
                  {currentSession?.title || "Select a Lecture"}
                </span>
                <span className="text-xs text-[#00D9C0] font-semibold border-l border-[#1A2830] pl-2 ml-1">
                  Change
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#8B9A9D]" />
              </button>

              {showPicker && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[#0A1014] border border-[#1A2830] rounded-xl shadow-2xl p-2 z-40 max-h-80 overflow-y-auto space-y-1">
                    <p className="text-[11px] font-mono text-[#8B9A9D] px-2 py-1 uppercase">
                      Select Lecture
                    </p>
                    {sessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSession(s.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                          s.id === currentSession?.id
                            ? "bg-[rgba(0,217,192,0.12)] text-[#00D9C0]"
                            : "text-[#F5F7F7] hover:bg-[#152025]"
                        }`}
                      >
                        <span className="truncate">{s.title}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Tutor Workspace */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto h-full">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-[#00D9C0]">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-[#8B9A9D]">Loading lecture context…</p>
            </div>
          ) : currentSession ? (
            <TutorTab
              sessionId={currentSession.id}
              chapters={activeSessionFull?.chapters || (currentSession as any).chapters}
              segments={activeSessionFull?.segments || (currentSession as any).segments}
              onSeek={() => {}}
            />
          ) : (
            <div className="bg-[#0D1519] border border-[#1A2830] rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto mt-12">
              <div className="w-16 h-16 rounded-full bg-[#152025] flex items-center justify-center mx-auto text-[#00D9C0]">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-[#F5F7F7]">No Lecture Selected</h3>
              <p className="text-[#8B9A9D] text-sm">
                Upload a lecture or pick one from your library to start interacting with the AI Tutor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
