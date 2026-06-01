"use client";

import { useState } from "react";
import { Flashcard } from "@/lib/store";

export function FlashcardsTab({ flashcards: raw }: { flashcards: any }) {
  const cards = (raw as Flashcard[]) ?? [];

  const [index,   setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done,    setDone]    = useState(false);

  if (!cards.length) {
    return (
      <div className="tab-content">
        <div className="fc-empty">
          <div className="fc-empty-icon">🃏</div>
          <p className="fc-empty-title">No flashcards available</p>
          <p className="fc-empty-sub">
            Flashcards are generated automatically when a video is processed.
          </p>
        </div>
      </div>
    );
  }

  const card    = cards[index];
  const total   = cards.length;
  const percent = Math.round(((index + (flipped ? 1 : 0)) / total) * 100);

  function handleFlip() {
    setFlipped((v) => !v);
  }

  function handleNext() {
    if (index < total - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else {
      setDone(true);
    }
  }

  function handlePrev() {
    if (index > 0) {
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  }

  function handleRestart() {
    setIndex(0);
    setFlipped(false);
    setDone(false);
  }

  // ── Completed state ───────────────────────────────────────────────────────
  if (done) {
    return (
      <>
        <FlashcardStyles />
        <div className="tab-content">
          <div className="fc-done">
            <div className="fc-done-icon">✦</div>
            <h2 className="fc-done-title">Session complete</h2>
            <p className="fc-done-sub">
              You reviewed all {total} flashcards.
            </p>
            <button className="fc-restart-btn" onClick={handleRestart}>
              ↺ Review again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FlashcardStyles />
      <div className="tab-content">
        <div className="fc-wrap">

          {/* Progress */}
          <div className="fc-progress-row">
            <span className="fc-counter">
              {index + 1} <span className="fc-counter-sep">/</span> {total}
            </span>
            <div className="fc-progress-bar">
              <div
                className="fc-progress-fill"
                style={{ width: `${((index + 1) / total) * 100}%` }}
              />
            </div>
            <span className="fc-side-label">
              {flipped ? "Answer" : "Question"}
            </span>
          </div>

          {/* Card */}
          <div
            className={`fc-card-scene`}
            onClick={handleFlip}
            title="Click to flip"
          >
            <div className={`fc-card ${flipped ? "flipped" : ""}`}>
              {/* Front */}
              <div className="fc-face fc-front">
                <div className="fc-face-label">Question</div>
                <p className="fc-face-text">{card.front}</p>
                <div className="fc-flip-hint">Click to reveal answer ↓</div>
              </div>
              {/* Back */}
              <div className="fc-face fc-back">
                <div className="fc-face-label">Answer</div>
                <p className="fc-face-text">{card.back}</p>
                <div className="fc-flip-hint">Click to see question ↑</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="fc-controls">
            <button
              className="fc-nav-btn"
              onClick={handlePrev}
              disabled={index === 0}
            >
              ← Prev
            </button>

            <button className="fc-flip-btn" onClick={handleFlip}>
              {flipped ? "↑ Show question" : "↓ Reveal answer"}
            </button>

            <button className="fc-nav-btn fc-next" onClick={handleNext}>
              {index === total - 1 ? "Finish ✓" : "Next →"}
            </button>
          </div>

          {/* All cards overview */}
          <div className="fc-dots">
            {cards.map((_, i) => (
              <button
                key={i}
                className={`fc-dot ${
                  i === index ? "current" : i < index ? "seen" : ""
                }`}
                onClick={() => { setIndex(i); setFlipped(false); }}
                title={`Card ${i + 1}`}
              />
            ))}
          </div>

        </div>
      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function FlashcardStyles() {
  return (
    <style>{`
      .fc-wrap {
        max-width: 620px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      /* Progress row */
      .fc-progress-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .fc-counter {
        font-family: var(--font-mono);
        font-size: 13px;
        color: var(--accent);
        flex-shrink: 0;
      }
      .fc-counter-sep { color: var(--muted); }
      .fc-progress-bar {
        flex: 1;
        height: 4px;
        background: var(--border);
        border-radius: 2px;
        overflow: hidden;
      }
      .fc-progress-fill {
        height: 100%;
        background: var(--accent);
        border-radius: 2px;
        transition: width 0.3s ease;
      }
      .fc-side-label {
        font-family: var(--font-mono);
        font-size: 10px;
        color: var(--muted);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        flex-shrink: 0;
        width: 60px;
        text-align: right;
      }

      /* Card 3D scene */
      .fc-card-scene {
        perspective: 1000px;
        cursor: pointer;
        height: 240px;
        user-select: none;
      }

      .fc-card {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .fc-card.flipped { transform: rotateY(180deg); }

      .fc-face {
        position: absolute;
        inset: 0;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        border-radius: 16px;
        padding: 28px 32px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        border: 1px solid var(--border);
      }

      .fc-front {
        background: var(--surface);
        border-color: var(--border2);
      }
      .fc-back {
        background: linear-gradient(135deg, #141008 0%, #1a1610 100%);
        border-color: rgba(200, 169, 110, 0.3);
        transform: rotateY(180deg);
      }

      .fc-face-label {
        font-family: var(--font-mono);
        font-size: 9px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--muted);
        margin-bottom: 14px;
        align-self: flex-start;
      }
      .fc-back .fc-face-label { color: var(--accent); }

      .fc-face-text {
        font-size: 17px;
        line-height: 1.55;
        color: var(--text);
        font-weight: 400;
        flex: 1;
        display: flex;
        align-items: center;
      }
      .fc-back .fc-face-text { color: #e8dcc8; }

      .fc-flip-hint {
        font-size: 11px;
        color: var(--muted);
        margin-top: 14px;
        font-family: var(--font-mono);
        align-self: flex-end;
      }

      /* Controls */
      .fc-controls {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .fc-nav-btn {
        padding: 10px 20px;
        background: var(--surface2);
        border: 1px solid var(--border);
        border-radius: 10px;
        color: var(--text2);
        font-size: 13px;
        font-family: var(--font-body);
        cursor: pointer;
        transition: border-color 0.15s, color 0.15s;
        flex-shrink: 0;
      }
      .fc-nav-btn:hover:not(:disabled) {
        border-color: var(--accent);
        color: var(--accent);
      }
      .fc-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .fc-nav-btn.fc-next:hover:not(:disabled) {
        border-color: var(--accent);
        color: var(--accent);
      }

      .fc-flip-btn {
        flex: 1;
        padding: 11px;
        background: var(--accent);
        border: none;
        border-radius: 10px;
        color: #0a0a0c;
        font-size: 14px;
        font-weight: 500;
        font-family: var(--font-body);
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .fc-flip-btn:hover { opacity: 0.85; }

      /* Dots */
      .fc-dots {
        display: flex;
        gap: 6px;
        justify-content: center;
        flex-wrap: wrap;
      }
      .fc-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: var(--border2);
        border: none; cursor: pointer;
        transition: background 0.15s, transform 0.15s;
        padding: 0;
      }
      .fc-dot.seen    { background: var(--border2); opacity: 0.6; }
      .fc-dot.current {
        background: var(--accent);
        transform: scale(1.3);
      }
      .fc-dot:hover { background: var(--text2); }

      /* Done state */
      .fc-done {
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        min-height: 320px; gap: 12px; text-align: center;
      }
      .fc-done-icon {
        font-size: 44px; color: var(--accent);
        animation: pulse 2s ease-in-out infinite;
      }
      .fc-done-title {
        font-family: var(--font-display);
        font-size: 26px; letter-spacing: -0.01em;
      }
      .fc-done-sub { color: var(--text2); font-size: 14px; }
      .fc-restart-btn {
        margin-top: 8px;
        padding: 12px 28px;
        background: var(--accent); color: #0a0a0c;
        border: none; border-radius: 10px;
        font-size: 14px; font-weight: 500;
        font-family: var(--font-body);
        cursor: pointer; transition: opacity 0.15s;
      }
      .fc-restart-btn:hover { opacity: 0.85; }

      /* Empty state */
      .fc-empty {
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        min-height: 280px; gap: 10px; text-align: center;
      }
      .fc-empty-icon { font-size: 40px; opacity: 0.4; }
      .fc-empty-title {
        font-size: 16px; font-weight: 500; color: var(--text2);
      }
      .fc-empty-sub { font-size: 13px; color: var(--muted); max-width: 280px; }
    `}</style>
  );
}