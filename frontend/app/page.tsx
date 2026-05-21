"use client";

import axios from "axios";
import { useState, useRef } from "react";

const API = "http://127.0.0.1:8000";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section-card">
      <div className="section-header">
        <span className="section-icon">{icon}</span>
        <h2 className="section-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function NotesList({ notes }: { notes: string }) {
  const lines = notes
    .split("\n")
    .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);
  return (
    <ul className="notes-list">
      {lines.map((line, i) => (
        <li key={i} className="note-item">
          <span className="note-bullet">◆</span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

function QuizSection({ quiz }: { quiz: any[] }) {
  const [selected, setSelected] = useState<Record<number, string>>({});

  return (
    <div className="quiz-list">
      {quiz.map((item: any, qi: number) => (
        <div key={qi} className="quiz-item">
          <p className="quiz-question">
            <span className="quiz-num">Q{qi + 1}</span>
            {item.question}
          </p>
          <div className="quiz-options">
            {item.options.map((opt: string, oi: number) => {
              const isSelected = selected[qi] === opt;
              const isCorrect = opt === item.answer;
              const answered = selected[qi] !== undefined;
              let state = "";
              if (answered && isSelected && isCorrect) state = "correct";
              else if (answered && isSelected && !isCorrect) state = "wrong";
              else if (answered && isCorrect) state = "reveal";
              return (
                <button
                  key={oi}
                  className={`quiz-option ${state}`}
                  onClick={() =>
                    !answered && setSelected({ ...selected, [qi]: opt })
                  }
                >
                  <span className="option-label">
                    {["A", "B", "C", "D"][oi]}
                  </span>
                  <span>{opt}</span>
                  {answered && isCorrect && (
                    <span className="option-badge correct-badge">✓</span>
                  )}
                  {answered && isSelected && !isCorrect && (
                    <span className="option-badge wrong-badge">✗</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true);
      setUploadError("");
      const response = await axios.post(`${API}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
      setSearchResults([]);
      setAnswer("");
      setQuestion("");
    } catch {
      setUploadError("Upload failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleYoutube() {

    if (!youtubeUrl.trim()) return;

    try {

      setLoading(true);
      setUploadError("");

      const response = await axios.post(
        `${API}/youtube/`,
        {
          url: youtubeUrl
        }
      );

      setResult(response.data);

      setSearchResults([]);
      setAnswer("");
      setQuestion("");

    } catch {

      setUploadError(
        "Could not process YouTube video."
      );

    } finally {

      setLoading(false);
    }
  }

  async function handleAskQuestion() {
    if (!question.trim()) return;
    try {
      setAsking(true);
      setAnswer("");
      const response = await axios.post(`${API}/qa/`, { question });
      setAnswer(response.data.answer);
    } catch {
      setAnswer("Could not get an answer. Please try again.");
    } finally {
      setAsking(false);
    }
  }

  async function handleSearch() {
    if (!search.trim()) { setSearchResults([]); return; }
    try {
      const response = await axios.post(`${API}/search/`, { query: search });
      setSearchResults(response.data.results);
    } catch {
      setSearchResults([]);
    }
  }

  const segments =
    searchResults.length > 0 ? searchResults : result?.segments || [];

  function seekTo(start: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = start;
      videoRef.current.play();
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("video/")) setFile(f);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #0c0c0e;
          --surface:  #141418;
          --surface2: #1c1c22;
          --border:   #2a2a34;
          --accent:   #e8d5a3;
          --accent2:  #a3c4e8;
          --danger:   #e87a6f;
          --success:  #7ac99a;
          --text:     #e8e6e0;
          --muted:    #7a7880;
          --font-display: 'DM Serif Display', Georgia, serif;
          --font-body:    'DM Sans', sans-serif;
          --font-mono:    'DM Mono', monospace;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
          line-height: 1.6;
          min-height: 100vh;
        }

        /* ── Layout ── */
        .page { max-width: 860px; margin: 0 auto; padding: 48px 24px 96px; }

        /* ── Header ── */
        .header { margin-bottom: 52px; }
        .header-eyebrow {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 12px;
        }
        .header-title {
          font-family: var(--font-display);
          font-size: clamp(42px, 7vw, 68px);
          line-height: 1;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        .header-title em {
          font-style: italic;
          color: var(--accent);
        }
        .header-sub {
          margin-top: 12px;
          color: var(--muted);
          font-size: 15px;
          font-weight: 300;
        }

        /* ── Upload zone ── */
        .upload-zone {
          border: 1.5px dashed var(--border);
          border-radius: 16px;
          padding: 40px 32px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          background: var(--surface);
          margin-bottom: 16px;
        }
        .upload-zone.drag { border-color: var(--accent); background: #1a1912; }
        .upload-zone.has-file { border-style: solid; border-color: var(--accent); }
        .upload-icon { font-size: 32px; margin-bottom: 12px; }
        .upload-label {
          font-size: 15px;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .upload-filename {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--accent);
        }
        .upload-hint { font-size: 12px; color: var(--muted); margin-top: 8px; }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent);
          color: #0c0c0e;
          border: none;
          border-radius: 10px;
          padding: 14px 28px;
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
          width: 100%;
          justify-content: center;
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .error-msg {
          font-size: 13px;
          color: var(--danger);
          margin-top: 10px;
          font-family: var(--font-mono);
        }

        /* ── Progress ── */
        .loading-bar {
          height: 3px;
          background: var(--border);
          border-radius: 2px;
          overflow: hidden;
          margin: 20px 0;
        }
        .loading-bar-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
          animation: loadingSlide 1.8s ease-in-out infinite;
        }
        @keyframes loadingSlide {
          0%   { width: 0%; margin-left: 0%; }
          50%  { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .loading-text {
          text-align: center;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--muted);
          letter-spacing: 0.08em;
        }

        /* ── Section card ── */
        .section-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px 28px 32px;
          margin-bottom: 20px;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .section-icon { font-size: 18px; }
        .section-title {
          font-family: var(--font-display);
          font-size: 20px;
          letter-spacing: -0.01em;
        }

        /* ── Video ── */
        .video-wrap { margin-bottom: 20px; }
        .video-wrap video {
          width: 100%;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: #000;
          display: block;
        }

        /* ── Summary ── */
        .summary-text {
          font-size: 15px;
          color: #ccc8c0;
          line-height: 1.8;
          font-weight: 300;
        }

        /* ── Notes ── */
        .notes-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .note-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-size: 14px;
          color: #ccc8c0;
          line-height: 1.6;
        }
        .note-bullet { color: var(--accent); flex-shrink: 0; margin-top: 2px; font-size: 10px; }

        /* ── Quiz ── */
        .quiz-list { display: flex; flex-direction: column; gap: 28px; }
        .quiz-item {}
        .quiz-question {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 12px;
          display: flex;
          gap: 10px;
          align-items: baseline;
        }
        .quiz-num {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--accent);
          background: #1e1c14;
          border: 1px solid #2e2a18;
          padding: 2px 7px;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .quiz-options { display: flex; flex-direction: column; gap: 8px; }
        .quiz-option {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 14px;
          color: var(--text);
          font-family: var(--font-body);
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s, background 0.15s;
        }
        .quiz-option:hover:not(.correct):not(.wrong):not(.reveal) {
          border-color: var(--accent);
          background: #1a1912;
        }
        .quiz-option.correct { background: #102018; border-color: var(--success); }
        .quiz-option.wrong   { background: #1a1010; border-color: var(--danger); }
        .quiz-option.reveal  { background: #102018; border-color: var(--success); opacity: 0.7; }
        .option-label {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--muted);
          width: 18px;
          flex-shrink: 0;
        }
        .option-badge { margin-left: auto; font-size: 13px; }
        .correct-badge { color: var(--success); }
        .wrong-badge   { color: var(--danger); }

        /* ── Transcript ── */
        .search-row { display: flex; gap: 10px; margin-bottom: 16px; }
        .input-field {
          flex: 1;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 11px 14px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text);
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field::placeholder { color: var(--muted); }
        .input-field:focus { border-color: var(--accent); }
        .btn-secondary {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 11px 18px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text);
          cursor: pointer;
          transition: border-color 0.15s;
          white-space: nowrap;
        }
        .btn-secondary:hover { border-color: var(--accent2); color: var(--accent2); }

        .segments-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 420px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .segments-list::-webkit-scrollbar { width: 4px; }
        .segments-list::-webkit-scrollbar-track { background: transparent; }
        .segments-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        .segment-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px 14px;
          background: var(--surface2);
          border: 1px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .segment-item:hover { border-color: var(--accent2); background: #12141e; }
        .segment-time {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--accent2);
          flex-shrink: 0;
          margin-top: 2px;
          background: #0e1018;
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid #1a1e2e;
        }
        .segment-text { font-size: 13px; color: #b8b4ac; line-height: 1.55; }
        .no-results {
          text-align: center;
          color: var(--muted);
          font-size: 13px;
          padding: 32px 0;
          font-family: var(--font-mono);
        }

        /* ── Q&A ── */
        .textarea-field {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 14px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text);
          outline: none;
          resize: vertical;
          min-height: 100px;
          transition: border-color 0.15s;
          margin-bottom: 12px;
        }
        .textarea-field::placeholder { color: var(--muted); }
        .textarea-field:focus { border-color: var(--accent); }

        .answer-box {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-left: 3px solid var(--accent);
          border-radius: 10px;
          padding: 18px 20px;
          margin-top: 16px;
        }
        .answer-label {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 10px;
        }
        .answer-text {
          font-size: 14px;
          color: #ccc8c0;
          line-height: 1.75;
          white-space: pre-wrap;
          font-weight: 300;
        }

        /* ── Divider ── */
        .results-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 32px 0 28px;
        }
        .results-divider-line { flex: 1; height: 1px; background: var(--border); }
        .results-divider-label {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
        }
      `}</style>

      <main className="page">

        {/* ── Header ── */}
        <header className="header">
          <p className="header-eyebrow">AI-powered learning</p>
          <h1 className="header-title">
            Study<em>Lens</em>
          </h1>
          <p className="header-sub">
            Upload a lecture or tutorial — get summaries, notes, quizzes, and answers instantly.
          </p>
        </header>

        {/* ── Upload ── */}
        <div
          className={`upload-zone ${dragOver ? "drag" : ""} ${file ? "has-file" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
          />
          <div className="upload-icon">{file ? "🎬" : "⬆"}</div>
          {file ? (
            <>
              <p className="upload-filename">{file.name}</p>
              <p className="upload-hint">Click to change file</p>
            </>
          ) : (
            <>
              <p className="upload-label">Drop a video file here</p>
              <p className="upload-hint">MP4, MOV, WebM · click to browse</p>
            </>
          )}
        </div>

        <div
          style={{
            marginBottom: 18
          }}
        >

          <div
            style={{
              display: "flex",
              gap: 10
            }}
          >

            <input
              type="text"

              className="input-field"

              placeholder="
        Paste YouTube video URL…
      "

              value={youtubeUrl}

              onChange={(e) =>
                setYoutubeUrl(e.target.value)
              }
            />

            <button
              className="btn-secondary"

              onClick={handleYoutube}

              disabled={
                loading ||
                !youtubeUrl.trim()
              }
            >
              Import
            </button>

          </div>

        </div>

        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? "⏳ Processing video…" : "Analyse Video →"}
        </button>

        {loading && (
          <div style={{ marginTop: 24 }}>
            <div className="loading-bar"><div className="loading-bar-fill" /></div>
            <p className="loading-text">Transcribing · Embedding · Generating…</p>
          </div>
        )}

        {uploadError && <p className="error-msg">{uploadError}</p>}

        {/* ── Results ── */}
        {result && (
          <>
            <div className="results-divider">
              <div className="results-divider-line" />
              <span className="results-divider-label">Analysis complete</span>
              <div className="results-divider-line" />
            </div>

            {/* Video player */}
            <div className="video-wrap">
              <video ref={videoRef} controls src={result.video_url} />
            </div>

            {/* Summary */}
            <SectionCard title="AI Summary" icon="📄">
              <p className="summary-text">{result.summary}</p>
            </SectionCard>

            {/* Notes */}
            {result.notes && (
              <SectionCard title="Study Notes" icon="📝">
                <NotesList notes={result.notes} />
              </SectionCard>
            )}

            {/* Quiz */}
            {result.quiz?.length > 0 && (
              <SectionCard title="Knowledge Check" icon="🧠">
                <QuizSection quiz={result.quiz} />
              </SectionCard>
            )}

            {/* Transcript search */}
            <SectionCard title="Semantic Search" icon="🔍">
              <div className="search-row">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search for a concept or keyword…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button className="btn-secondary" onClick={handleSearch}>Search</button>
                {searchResults.length > 0 && (
                  <button className="btn-secondary" onClick={() => { setSearch(""); setSearchResults([]); }}>
                    Clear
                  </button>
                )}
              </div>
              <div className="segments-list">
                {segments.length === 0 ? (
                  <p className="no-results">No segments yet</p>
                ) : (
                  segments.map((seg: any, i: number) => (
                    <div key={i} className="segment-item" onClick={() => seekTo(seg.start)}>
                      <span className="segment-time">{formatTime(seg.start)}</span>
                      <p className="segment-text">{seg.text}</p>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            {/* Q&A */}
            <SectionCard title="Ask the Video" icon="💬">
              <textarea
                className="textarea-field"
                placeholder="Ask anything about the video content…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAskQuestion();
                }}
              />
              <button
                className="btn-primary"
                onClick={handleAskQuestion}
                disabled={asking || !question.trim()}
              >
                {asking ? "⏳ Thinking…" : "Ask AI →"}
              </button>
              {answer && (
                <div className="answer-box">
                  <p className="answer-label">Answer</p>
                  <p className="answer-text">{answer}</p>
                </div>
              )}
            </SectionCard>
          </>
        )}
      </main>
    </>
  );
}