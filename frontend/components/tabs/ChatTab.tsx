"use client";

import { useState, useRef, useEffect } from "react";
import { askQuestionAPI, askAllSessionsAPI, AnswerSection } from "@/lib/api-client";
import { Segment } from "@/lib/store";
import { useStore } from "@/lib/store";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Source {
  session_id: string;
  title:      string;
  source:     string;
}

interface Message {
  role:         "user" | "assistant";
  content:      string;             // raw text — used for "this video" mode
  segments?:    Segment[];          // single-video timestamp sources
  sections?:    AnswerSection[];     // multi-session structured sections
  multiSources?: Source[];          // multi-session video sources
  scope:        "current" | "all";
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function sectionIcon(type: AnswerSection["type"]) {
  switch (type) {
    case "lecture":     return "🎬";
    case "themes":       return "🔗";
    case "differences":  return "⚖️";
    case "conclusion":   return "✦";
    default:             return "•";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatTab({
  videoId,
  onSeek,
}: {
  videoId?: string;
  onSeek:   (t: number) => void;
}) {
  const { user, sessions } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [scope,    setScope]    = useState<"current" | "all">("current");
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
        setMessages((m) => [...m, {
          role:     "assistant",
          content:  data.answer,
          segments: data.sources,
          scope:    "current",
        }]);

      } else {
        if (!user?.id) {
          setMessages((m) => [...m, {
            role: "assistant", content: "Please log in to use multi-session search.", scope: "all",
          }]);
          return;
        }
        const data = await askAllSessionsAPI(q, user.id);
        setMessages((m) => [...m, {
          role:         "assistant",
          content:      data.answer,
          sections:     data.sections,
          multiSources: data.sources,
          scope:        "all",
        }]);
      }

    } catch {
      setMessages((m) => [...m, {
        role: "assistant", content: "Failed to get an answer. Please try again.", scope,
      }]);
    } finally {
      setLoading(false);
    }
  }

  const sessionCount = sessions.filter((s) => s.status === "READY").length;

  return (
    <>
      <ChatStyles />
      <div className="chat-wrap">

        {/* ── Scope selector ── */}
        <div className="scope-selector">
          <button
            className={`scope-btn ${scope === "current" ? "active" : ""}`}
            onClick={() => handleScopeChange("current")}
          >
            This Video
          </button>
          <button
            className={`scope-btn ${scope === "all" ? "active" : ""}`}
            onClick={() => handleScopeChange("all")}
            disabled={sessionCount === 0}
          >
            All Sessions
            <span className="scope-count">{sessionCount}</span>
          </button>
        </div>

        {/* ── Messages ── */}
        <div className="chat-messages">
          {messages.length === 0 && scope === "current" && (
            <div className="chat-empty">
              <p>Ask anything about this video.</p>
              <p className="chat-hint">
                e.g. "What is the main argument?" · "Explain the key concept"
              </p>
            </div>
          )}
          {messages.length === 0 && scope === "all" && (
            <div className="chat-empty">
              <p>Ask across all your lectures.</p>
              <p className="chat-hint">
                e.g. "What common advice appears in all productivity videos?"
                · "Compare Python concepts from all lectures"
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>

              {msg.role === "user" && (
                <div className="msg-bubble">{msg.content}</div>
              )}

              {/* ── Assistant — single video (unchanged simple bubble) ── */}
              {msg.role === "assistant" && msg.scope === "current" && (
                <>
                  <span className="scope-label current">This video</span>
                  <div className="msg-bubble">{msg.content}</div>
                  {msg.segments && msg.segments.length > 0 && (
                    <div className="msg-sources">
                      {msg.segments.map((s, si) => (
                        <button
                          key={si}
                          className="source-chip"
                          onClick={() => onSeek(s.start)}
                          title={s.text}
                        >
                          ▶ {fmt(s.start)}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Assistant — multi-session structured answer ── */}
              {msg.role === "assistant" && msg.scope === "all" && (
                <div className="multi-answer">
                  <span className="scope-label all">All sessions</span>

                  {/* Sources found banner */}
                  {msg.multiSources && msg.multiSources.length > 0 && (
                    <div className="sources-found">
                      <span className="sources-found-label">Sources Found</span>
                      <div className="sources-found-chips">
                        {msg.multiSources.map((src, si) => (
                          <span key={si} className="lecture-chip">
                            <span className="lecture-chip-icon">
                              {src.source === "YOUTUBE" ? "▶" : "🎬"}
                            </span>
                            {src.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structured sections */}
                  {msg.sections && msg.sections.length > 0 ? (
                    <div className="answer-sections">
                      {msg.sections.map((sec, si) => (
                        <div key={si} className={`answer-section section-${sec.type}`}>
                          <div className="section-heading">
                            <span className="section-icon">{sectionIcon(sec.type)}</span>
                            {sec.heading}
                          </div>
                          <p className="section-content">{sec.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Fallback — model didn't produce structured output
                    <div className="msg-bubble">{msg.content}</div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-msg assistant">
              <div className="msg-bubble typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder={
              scope === "current"
                ? "Ask about this video… (Enter to send)"
                : "Ask across all your lectures…"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            disabled={loading}
          />
          <button
            className="chat-send"
            onClick={send}
            disabled={loading || !input.trim()}
          >→</button>
        </div>

      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function ChatStyles() {
  return (
    <style>{`
      .scope-selector {
        display: flex; gap: 6px; margin-bottom: 16px;
        background: var(--surface2); border: 1px solid var(--border);
        border-radius: 10px; padding: 4px;
      }
      .scope-btn {
        flex: 1; padding: 8px 12px; border-radius: 7px;
        background: none; border: none; font-size: 13px;
        font-family: var(--font-body); color: var(--text2);
        cursor: pointer; transition: all 0.12s; text-align: center;
      }
      .scope-btn.active {
        background: var(--surface); border: 1px solid var(--border2);
        color: var(--accent);
      }
      .scope-btn:not(.active):hover { color: var(--text); }
      .scope-count {
        font-family: var(--font-mono); font-size: 9px;
        background: var(--border); padding: 1px 5px;
        border-radius: 3px; margin-left: 5px; color: var(--muted);
      }
      .scope-btn.active .scope-count {
        background: rgba(200,169,110,0.2); color: var(--accent);
      }

      .scope-label {
        font-family: var(--font-mono); font-size: 9px;
        letter-spacing: 0.08em; text-transform: uppercase;
        padding: 2px 6px; border-radius: 3px; margin-bottom: 6px;
        display: inline-block;
      }
      .scope-label.current { background: rgba(126,184,201,0.15); color: var(--accent2); }
      .scope-label.all      { background: rgba(200,169,110,0.15); color: var(--accent); }

      /* ── Sources Found banner ── */
      .multi-answer { display: flex; flex-direction: column; gap: 4px; max-width: 100%; }
      .sources-found {
        background: var(--surface); border: 1px solid var(--border);
        border-radius: 10px; padding: 10px 14px; margin-bottom: 8px;
      }
      .sources-found-label {
        font-family: var(--font-mono); font-size: 9px;
        letter-spacing: 0.1em; text-transform: uppercase;
        color: var(--muted); display: block; margin-bottom: 6px;
      }
      .sources-found-chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .lecture-chip {
        background: var(--surface2); border: 1px solid var(--border2);
        border-radius: 6px; padding: 4px 10px; font-size: 12px;
        color: var(--text); display: flex; align-items: center; gap: 6px;
      }
      .lecture-chip-icon { font-size: 11px; }

      /* ── Structured answer sections ── */
      .answer-sections {
        display: flex; flex-direction: column; gap: 10px;
      }
      .answer-section {
        background: var(--surface); border: 1px solid var(--border);
        border-left: 3px solid var(--border2);
        border-radius: 10px; padding: 12px 16px;
      }
      .section-heading {
        font-size: 13px; font-weight: 600; color: var(--text);
        margin-bottom: 6px; display: flex; align-items: center; gap: 7px;
      }
      .section-icon { font-size: 13px; }
      .section-content {
        font-size: 13.5px; color: var(--text2); line-height: 1.65;
        white-space: pre-wrap;
      }

      .section-lecture     { border-left-color: var(--accent2); }
      .section-lecture .section-heading { color: var(--accent2); }

      .section-themes      { border-left-color: #7ec98a; }
      .section-themes .section-heading { color: #7ec98a; }

      .section-differences { border-left-color: #c98a6e; }
      .section-differences .section-heading { color: #c98a6e; }

      .section-conclusion {
        border-left-color: var(--accent);
        background: rgba(200,169,110,0.06);
      }
      .section-conclusion .section-heading { color: var(--accent); }
      .section-conclusion .section-content { color: var(--text); font-weight: 400; }

      /* ── Shared chat styles (existing) ── */
      .chat-wrap { display: flex; flex-direction: column; height: calc(100vh - 360px); min-height: 400px; }
      .chat-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding-bottom: 8px; }
      .chat-empty { text-align: center; padding: 40px 20px; color: var(--muted); }
      .chat-hint { font-size: 12px; margin-top: 8px; color: var(--border2); font-family: var(--font-mono); }
      .chat-msg { display: flex; flex-direction: column; gap: 6px; }
      .chat-msg.user { align-items: flex-end; }
      .chat-msg.assistant { align-items: flex-start; width: 100%; }
      .msg-bubble {
        max-width: 80%; padding: 12px 16px; border-radius: 14px;
        font-size: 14px; line-height: 1.65;
      }
      .chat-msg.user .msg-bubble { background: var(--accent); color: #0a0a0c; }
      .chat-msg.assistant .msg-bubble { background: var(--surface2); border: 1px solid var(--border); color: var(--text); }
      .typing { display: flex; gap: 5px; align-items: center; padding: 14px 18px !important; }
      .typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: blink 1.2s infinite; }
      .typing span:nth-child(2) { animation-delay: 0.2s; }
      .typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
      .msg-sources { display: flex; flex-wrap: wrap; gap: 6px; }
      .source-chip {
        background: var(--surface); border: 1px solid var(--border);
        border-radius: 4px; padding: 3px 9px; font-family: var(--font-mono);
        font-size: 10px; color: var(--accent2); cursor: pointer;
      }
      .chat-input-row { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border); margin-top: 4px; }
      .chat-input {
        flex: 1; background: var(--surface2); border: 1px solid var(--border);
        border-radius: 10px; padding: 11px 14px; font-size: 14px; color: var(--text);
        font-family: var(--font-body); outline: none;
      }
      .chat-input:focus { border-color: var(--accent); }
      .chat-send {
        padding: 11px 18px; background: var(--accent); border: none;
        border-radius: 10px; color: #0a0a0c; font-size: 16px; cursor: pointer;
      }
      .chat-send:disabled { opacity: 0.4; cursor: not-allowed; }
    `}</style>
  );
}