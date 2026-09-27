"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send,
  MessageSquare,
  Layers,
  Film,
  Scale,
  Sparkles,
  Clock,
  Loader2,
  Video,
} from "lucide-react";
import { askQuestionAPI, askAllSessionsAPI, AnswerSection } from "@/lib/api-client";
import { Segment } from "@/lib/store";
import { useStore } from "@/lib/store";

interface Source {
  session_id: string;
  title: string;
  source: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  segments?: Segment[];
  sections?: AnswerSection[];
  multiSources?: Source[];
  scope: "current" | "all";
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

export function ChatTab({
  videoId,
  onSeek,
}: {
  videoId?: string;
  onSeek: (t: number) => void;
}) {
  const { user, sessions } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<"current" | "all">("current");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleScopeChange(s: "current" | "all") {
    setScope(s);
    setMessages([]);
    setInput("");
  }

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");

    setMessages((m) => [...m, { role: "user", content: q, scope }]);
    setLoading(true);

    try {
      if (scope === "current") {
        const data = await askQuestionAPI(q, videoId);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.answer,
            segments: data.sources,
            scope: "current",
          },
        ]);
      } else {
        if (!user?.id) {
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              content: "Please log in to query across all sessions.",
              scope: "all",
            },
          ]);
          return;
        }
        const data = await askAllSessionsAPI(q, user.id);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.answer,
            sections: data.sections,
            multiSources: data.sources,
            scope: "all",
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Failed to retrieve an answer. Please try rephrasing your question.",
          scope,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const sessionCount = sessions.filter((s) => s.status === "READY").length;

  return (
    <div className="flex h-[calc(100vh-340px)] min-h-[460px] max-w-4xl flex-col">
      {/* Scope Selector */}
      <div className="mb-4 flex items-center justify-between border-b border-[#1A2830] pb-3">
        <div className="flex rounded-xl border border-[#1A2830] bg-[#0D1519] p-1">
          <button
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              scope === "current"
                ? "bg-[#00D9C0] text-white shadow-sm"
                : "text-[#8B9A9D] hover:text-white"
            }`}
            onClick={() => handleScopeChange("current")}
          >
            <Video className="h-3.5 w-3.5" />
            <span>This Lecture</span>
          </button>
          <button
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              scope === "all"
                ? "bg-[#00D9C0] text-white shadow-sm"
                : "text-[#8B9A9D] hover:text-white"
            }`}
            onClick={() => handleScopeChange("all")}
            disabled={sessionCount === 0}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Cross-Session Knowledge</span>
            <span className="rounded bg-[#111A1F] px-1.5 py-0.2 text-[10px] text-[#00D9C0]">
              {sessionCount}
            </span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-[#4A5B62]">
          Strictly grounded in lecture context
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center text-sm text-[#8B9A9D]">
            <MessageSquare className="mb-3 h-8 w-8 text-[#4A5B62]/40" />
            <p className="font-semibold text-white">
              {scope === "current"
                ? "Ask anything about this lecture"
                : "Ask questions across all your saved lectures"}
            </p>
            <p className="mt-1 max-w-sm text-xs text-[#4A5B62]">
              {scope === "current"
                ? "Answers are synthesized with citations directly pointing to lecture timestamps."
                : "Compares, contrasts, and synthesizes concepts across all processed lectures."}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-1.5 ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {msg.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl bg-gradient-to-r from-[#00D9C0] to-[#00B09D] px-4 py-3 text-sm text-white shadow-md shadow-[#00D9C0]/15">
                {msg.content}
              </div>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#33E3D0]">
                  {msg.scope === "current" ? "Knowledge Base Response" : "Cross-Lecture Synthesis"}
                </span>

                {/* Sources found chips */}
                {msg.multiSources && msg.multiSources.length > 0 && (
                  <div className="rounded-xl border border-[#1A2830] bg-[#0D1519] p-3 text-xs">
                    <span className="mb-2 block font-mono text-[10px] uppercase text-[#4A5B62]">
                      Retrieved from lectures:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.multiSources.map((src, si) => (
                        <span
                          key={si}
                          className="flex items-center gap-1 rounded-md bg-[#111A1F] px-2 py-0.5 text-xs text-[#F5F7F7]"
                        >
                          <Film className="h-3 w-3 text-[#00D9C0]" />
                          <span>{src.title}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multi-section or single answer */}
                {msg.sections && msg.sections.length > 0 ? (
                  <div className="space-y-2.5">
                    {msg.sections.map((sec, si) => (
                      <div
                        key={si}
                        className="rounded-xl border border-[#1A2830] bg-[#0D1519] p-4 text-sm leading-relaxed"
                      >
                        <h4 className="mb-1.5 font-bold text-white flex items-center gap-1.5">
                          {sec.type === "themes" && <Sparkles className="h-3.5 w-3.5 text-[#10b981]" />}
                          {sec.type === "differences" && <Scale className="h-3.5 w-3.5 text-[#f59e0b]" />}
                          <span>{sec.heading}</span>
                        </h4>
                        <p className="text-[#F5F7F7] whitespace-pre-wrap">{sec.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="max-w-[90%] rounded-2xl border border-[#1A2830] bg-[#0D1519] p-4 text-sm leading-relaxed text-[#F5F7F7] shadow-md">
                    {msg.content}
                  </div>
                )}

                {/* Single-video timestamp source chips */}
                {msg.segments && msg.segments.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono text-[#4A5B62]">Jump to:</span>
                    {msg.segments.map((s, si) => (
                      <button
                        key={si}
                        onClick={() => onSeek(s.start)}
                        className="flex items-center gap-1 rounded-md border border-[#00D9C0]/30 bg-[#00D9C0]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#00D9C0] hover:border-[#00D9C0] hover:text-white"
                        title={s.text}
                      >
                        <Clock className="h-3 w-3" />
                        <span>{fmt(s.start)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 rounded-2xl border border-[#1A2830] bg-[#0D1519] p-4 text-xs text-[#8B9A9D]">
            <Loader2 className="h-4 w-4 animate-spin text-[#00D9C0]" />
            <span>Consulting Knowledge Base…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="mt-3 flex items-center gap-2 border-t border-[#1A2830] pt-3">
        <input
          className="flex-1 rounded-xl border border-[#1A2830] bg-[#0D1519] px-4 py-3 text-sm text-white placeholder-[#4A5B62] outline-none transition-colors focus:border-[#00D9C0]"
          placeholder={
            scope === "current"
              ? "Ask a question about this lecture… (Enter to send)"
              : "Ask across all lectures in your library…"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#00D9C0] to-[#00B09D] text-white shadow-md shadow-[#00D9C0]/20 hover:opacity-95 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}