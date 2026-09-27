"use client";

import { useState } from "react";
import {
  Sparkles,
  Zap,
  Target,
  Shuffle,
  ChevronDown,
  BookOpen,
  ArrowRight,
  Clock,
  CheckCircle2,
  Award,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useSession } from "@/hooks/useSession";
import { RevisionTab } from "@/components/tabs/RevisionTab";

interface Attempt {
  id: string;
  mode: string;
  date: string;
  score: string;
  percent: number;
}

export function RevisionView() {
  const { sessions, activeSessionId, activeSessionFull, user } = useStore();
  const { loadSession } = useSession();

  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<"quick" | "detailed" | "mixed" | null>(null);

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

  // Sample past attempts matching Screen 8 mockup
  const sampleAttempts: Attempt[] = [
    {
      id: "1",
      mode: "Quick Review",
      date: "Aug 18, 2025",
      score: "4/5 correct",
      percent: 80,
    },
    {
      id: "2",
      mode: "Detailed Practice",
      date: "Aug 15, 2025",
      score: "11/15 correct",
      percent: 73,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#05090B]">
      {/* Top Header matching Screen 8 Mockup */}
      <div className="border-b border-[#1A2830] bg-[#0A1014] px-6 py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F5F7F7] flex items-center gap-2.5">
              <Sparkles className="h-6 w-6 text-[#FF3347]" />
              <span>Revision</span>
            </h1>
            <p className="text-[#8B9A9D] text-sm mt-0.5">
              Test your understanding and reinforce your learning.
            </p>
          </div>

          {/* Lecture Selector Dropdown */}
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-10">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-[#00D9C0]">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-[#8B9A9D]">Loading revision materials…</p>
            </div>
          ) : !currentSession ? (
            <div className="bg-[#0D1519] border border-[#1A2830] rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto">
              <Sparkles className="h-10 w-10 text-[#FF3347] mx-auto" />
              <h3 className="text-lg font-semibold text-[#F5F7F7]">No Lecture Selected</h3>
              <p className="text-[#8B9A9D] text-sm">
                Select a lecture to generate tailored revision notes and practice challenges.
              </p>
            </div>
          ) : activeMode ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#1A2830] pb-4">
                <button
                  onClick={() => setActiveMode(null)}
                  className="text-xs text-[#8B9A9D] hover:text-[#00D9C0] flex items-center gap-1 font-medium transition-colors"
                >
                  ← Back to Modes
                </button>
                <span className="text-xs font-mono uppercase tracking-wider text-[#00D9C0]">
                  Mode: {activeMode.toUpperCase()}
                </span>
              </div>

              <RevisionTab
                sessionId={currentSession.id}
                userId={user?.id || ""}
                title={currentSession.title}
                summary={(currentSession as any).summary}
                notes={(currentSession as any).notes}
                chapters={(currentSession as any).chapters}
                quiz={(currentSession as any).quiz}
                flashcards={(currentSession as any).flashcards}
                cachedRevision={(currentSession as any).revision}
              />
            </div>
          ) : (
            <>
              {/* Choose your revision mode (Screen 8) */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-[#F5F7F7]">Choose your revision mode</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Quick Review Card */}
                  <div className="bg-[#0D1519] border border-[#1A2830] hover:border-[#FF3347]/50 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all hover:bg-[#111A1F]">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-[#FF3347]/10 flex items-center justify-center text-[#FF3347]">
                        <Zap className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-[#F5F7F7]">Quick Review</h3>
                      <p className="text-xs text-[#8B9A9D] leading-relaxed">
                        5 questions · Quick understanding of the core concepts and essentials.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveMode("quick")}
                      className="w-full flex items-center justify-center gap-2 bg-[#FF3347] hover:bg-[#E62E40] text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-md shadow-[#FF3347]/20"
                    >
                      <span>Start</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Detailed Practice Card */}
                  <div className="bg-[#0D1519] border border-[#1A2830] hover:border-[#00D9C0]/50 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all hover:bg-[#111A1F]">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-[#00D9C0]/10 flex items-center justify-center text-[#00D9C0]">
                        <Target className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-[#F5F7F7]">Detailed Practice</h3>
                      <p className="text-xs text-[#8B9A9D] leading-relaxed">
                        15 questions · In-depth practice covering subtle nuances and tricky details.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveMode("detailed")}
                      className="w-full flex items-center justify-center gap-2 bg-[#00D9C0] hover:bg-[#00B09D] text-[#05090B] font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-md shadow-[#00D9C0]/20"
                    >
                      <span>Start</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Mixed Mode Card */}
                  <div className="bg-[#0D1519] border border-[#1A2830] hover:border-[#FF5A6A]/50 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all hover:bg-[#111A1F]">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FF3347]/20 to-[#00D9C0]/20 flex items-center justify-center text-[#F5F7F7]">
                        <Shuffle className="h-6 w-6 text-[#FF5A6A]" />
                      </div>
                      <h3 className="text-lg font-bold text-[#F5F7F7]">Mixed Mode</h3>
                      <p className="text-xs text-[#8B9A9D] leading-relaxed">
                        Random questions · Varied difficulty combining recall, applications, and edge cases.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveMode("mixed")}
                      className="w-full flex items-center justify-center gap-2 bg-[#111A1F] hover:bg-[#152025] border border-[#1A2830] text-[#F5F7F7] font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors"
                    >
                      <span>Start</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Previous Attempts (Screen 8) */}
              <section className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#F5F7F7]">Previous Attempts</h3>
                  <button className="text-xs text-[#00D9C0] hover:underline font-medium">
                    See all →
                  </button>
                </div>

                <div className="space-y-3">
                  {sampleAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="bg-[#0D1519] border border-[#1A2830] rounded-xl p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#111A1F] flex items-center justify-center text-[#00D9C0]">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#F5F7F7]">{attempt.mode}</h4>
                          <p className="text-xs text-[#8B9A9D] font-mono mt-0.5">{attempt.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-sm font-bold font-mono text-[#00D9C0]">
                            {attempt.percent}%
                          </span>
                          <p className="text-[11px] text-[#8B9A9D] font-mono">{attempt.score}</p>
                        </div>
                        <button
                          onClick={() => setActiveMode("quick")}
                          className="bg-[#111A1F] hover:bg-[#152025] border border-[#1A2830] text-xs font-medium text-[#F5F7F7] px-3.5 py-1.5 rounded-lg transition-colors"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
