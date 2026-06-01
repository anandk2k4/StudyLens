"use client";

import { useState, useRef, useEffect } from "react";
import { askQuestionAPI } from "@/lib/api-client";   // ← was askQuestion from lib/api
import { Segment } from "@/lib/store";               // ← type from store

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Segment[];
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

export function ChatTab({ videoId, onSeek }: { videoId?: string; onSeek: (t: number) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const data = await askQuestionAPI(q, videoId);   // ← updated function name
      setMessages((m) => [...m, { role: "assistant", content: data.answer, sources: data.sources }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Failed to get an answer. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-wrap">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Ask anything about this video.</p>
            <p className="chat-hint">e.g. "What is the main argument?" · "Explain the key concept"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role}`}>
            <div className="msg-bubble">{msg.content}</div>
            {msg.sources && msg.sources.length > 0 && (
              <div className="msg-sources">
                {msg.sources.map((s, si) => (
                  <button key={si} className="source-chip" onClick={() => onSeek(s.start)} title={s.text}>
                    ▶ {fmt(s.start)}
                  </button>
                ))}
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
      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Ask about the video… (Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          disabled={loading}
        />
        <button className="chat-send" onClick={send} disabled={loading || !input.trim()}>→</button>
      </div>
    </div>
  );
}