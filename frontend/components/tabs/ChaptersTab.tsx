"use client";

import { useState, useEffect } from "react";
import { Chapter } from "@/lib/store";

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ChaptersTab({
  chapters: raw,
  currentTime = 0,
  onSeek,
}: {
  chapters:    any;
  currentTime?: number;
  onSeek:      (t: number) => void;
}) {
  const chapters = (raw as Chapter[]) ?? [];
  const [activeIdx, setActiveIdx] = useState(0);

  // Track active chapter based on video currentTime
  useEffect(() => {
    if (!chapters.length) return;
    const idx = chapters.findLastIndex((c) => currentTime >= c.start);
    if (idx !== -1 && idx !== activeIdx) setActiveIdx(idx);
  }, [currentTime, chapters]);

  if (!chapters.length) {
    return (
      <div className="tab-content">
        <div className="ch-empty">
          <div className="ch-empty-icon">📖</div>
          <p className="ch-empty-title">No chapters available</p>
          <p className="ch-empty-sub">
            Chapters are generated automatically when a video is processed.
            Short videos (under 5 min) may not have chapters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ChapterStyles />
      <div className="tab-content">
        <div className="ch-header">
          <span className="ch-count">{chapters.length} chapters</span>
        </div>

        <div className="ch-list">
          {chapters.map((chapter, idx) => {
            const isActive = idx === activeIdx;
            const duration = chapter.end - chapter.start;

            return (
              <div
                key={idx}
                className={`ch-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  setActiveIdx(idx);
                  onSeek(chapter.start);
                }}
              >
                {/* Left — number + timestamp */}
                <div className="ch-left">
                  <span className="ch-num">{idx + 1}</span>
                  <span className="ch-time">{fmt(chapter.start)}</span>
                </div>

                {/* Center — title + summary */}
                <div className="ch-body">
                  <p className="ch-title">{chapter.title}</p>
                  <p className="ch-summary">{chapter.summary}</p>
                </div>

                {/* Right — duration */}
                <div className="ch-right">
                  <span className="ch-duration">{fmt(duration)}</span>
                  {isActive && <span className="ch-playing">▶</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ChapterStyles() {
  return (
    <style>{`
      .ch-header {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 16px;
      }
      .ch-count {
        font-family: var(--font-mono); font-size: 11px;
        color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase;
      }

      .ch-list { display: flex; flex-direction: column; gap: 4px; }

      .ch-item {
        display: flex; align-items: flex-start; gap: 14px;
        padding: 14px 16px; border-radius: 12px;
        background: var(--surface); border: 1px solid transparent;
        cursor: pointer; transition: background 0.12s, border-color 0.12s;
      }
      .ch-item:hover { background: var(--surface2); border-color: var(--border); }
      .ch-item.active {
        background: var(--surface2);
        border-color: var(--accent);
      }

      .ch-left {
        display: flex; flex-direction: column;
        align-items: center; gap: 4px; flex-shrink: 0;
        padding-top: 2px;
      }
      .ch-num {
        width: 22px; height: 22px; border-radius: 6px;
        background: var(--border); color: var(--text2);
        font-family: var(--font-mono); font-size: 10px; font-weight: 500;
        display: flex; align-items: center; justify-content: center;
      }
      .ch-item.active .ch-num {
        background: var(--accent); color: #0a0a0c;
      }
      .ch-time {
        font-family: var(--font-mono); font-size: 10px;
        color: var(--accent2);
      }
      .ch-item.active .ch-time { color: var(--accent); }

      .ch-body { flex: 1; min-width: 0; }
      .ch-title {
        font-size: 14px; font-weight: 500; color: var(--text);
        margin-bottom: 4px; line-height: 1.3;
      }
      .ch-item.active .ch-title { color: var(--accent); }
      .ch-summary {
        font-size: 12px; color: var(--muted); line-height: 1.5;
      }

      .ch-right {
        display: flex; flex-direction: column;
        align-items: flex-end; gap: 4px; flex-shrink: 0;
      }
      .ch-duration {
        font-family: var(--font-mono); font-size: 10px; color: var(--muted);
      }
      .ch-playing {
        font-size: 8px; color: var(--accent);
        animation: pulse 1.5s ease-in-out infinite;
      }
      @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }

      .ch-empty {
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        min-height: 260px; gap: 10px; text-align: center;
      }
      .ch-empty-icon { font-size: 38px; opacity: 0.4; }
      .ch-empty-title { font-size: 15px; font-weight: 500; color: var(--text2); }
      .ch-empty-sub { font-size: 13px; color: var(--muted); max-width: 300px; line-height: 1.6; }
    `}</style>
  );
}