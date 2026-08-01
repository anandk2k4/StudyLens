"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateRevisionAPI, RevisionData } from "@/lib/api-client";

type Difficulty = "beginner" | "intermediate" | "advanced";

interface SectionMeta {
  key:   keyof RevisionData;
  icon:  string;
  label: string;
  color: string;
  id:    string;
}

const SECTIONS: SectionMeta[] = [
  { key: "quick_revision",    icon: "⚡", label: "Quick Revision",        color: "#c8a032", id: "quick" },
  { key: "detailed_revision", icon: "📖", label: "Detailed Revision",     color: "#4a9cc8", id: "detailed" },
  { key: "cheat_sheet",       icon: "📄", label: "Cheat Sheet",           color: "#5aab72", id: "cheat" },
  { key: "key_concepts",      icon: "🧠", label: "Key Concepts",          color: "#9b72c8", id: "concepts" },
  { key: "common_mistakes",   icon: "⚠️", label: "Common Mistakes",       color: "#c96e6e", id: "mistakes" },
  { key: "memory_tricks",     icon: "💡", label: "Memory Tricks",         color: "#c87a3a", id: "memory" },
  { key: "exam_questions",    icon: "📝", label: "Likely Exam Questions",  color: "#3abcc8", id: "exam" },
  { key: "final_checklist",   icon: "✅", label: "Final Checklist",       color: "#6db88a", id: "checklist" },
];

const QUICK_JUMPS = [
  { icon: "⚡", label: "1 Min Revision", id: "quick" },
  { icon: "📚", label: "5 Min Revision", id: "detailed" },
  { icon: "📄", label: "Cheat Sheet",    id: "cheat" },
  { icon: "🧠", label: "Exam Questions", id: "exam" },
];

const DIFFICULTY_META = {
  beginner:     { color: "#6db88a", emoji: "🌱" },
  intermediate: { color: "#c8a96e", emoji: "🔥" },
  advanced:     { color: "#c96e6e", emoji: "⚡" },
};

// ── Text renderer ─────────────────────────────────────────────────────────────
// Handles the messy markdown Gemini returns:
//   - Strips ### headings, renders as bold label
//   - Splits on – or - inline separators into bullet points
//   - Wraps **word** in <strong>

function applyInline(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function isHeadingLine(t: string): boolean {
  // Strip trailing colon for the check, but keep original for display
  const clean = t.replace(/:$/, "").trim();
  const wordCount = clean.split(/\s+/).length;

  // Reject if it ends with a period, comma, or other sentence punctuation
  if (/[.,;]$/.test(t)) return false;

  // Reject if too long to be a title
  if (wordCount > 7) return false;

  // Reject if it starts with a lowercase word that suggests mid-sentence
  // (e.g. "and this...", "but the...")
  if (/^(and|but|or|so|because|which|that|this)\s/i.test(clean)) return false;

  // Accept: Title Case phrases, "Key Platform: WAP" style, or short noun phrases
  // Most section titles in this content have every major word capitalized,
  // or end in a colon before this cleaning step, or are very short (≤4 words)
  const capWords = clean.split(/\s+/).filter(w => /^[A-Z]/.test(w));
  const capRatio = capWords.length / wordCount;

  return capRatio >= 0.6 || wordCount <= 4;
}

type RevItem = { text: string; heading: boolean };

function RevisionText({ text }: { text: string }) {
  // Step 1: strip ### / ## / # prefixes from any line
  const stripped = text
    .split("\n")
    .map(line => line.replace(/^#{1,3}\s+/, ""))
    .join("\n");

  // Step 2: split each line on "– " or " - " separators to get flat items
  const items: RevItem[] = [];

  function pushItem(raw: string) {
    const t = raw.trim();
    if (!t) return;
    items.push({ text: t, heading: isHeadingLine(t) });
  }

  stripped.split("\n").forEach(line => {
    const t = line.trim();
    if (!t) return;
    // If line contains inline dash separators, split into multiple items
    if (t.includes("– ") || / – /.test(t)) {
      t.split(/\s*–\s*/).forEach(pushItem);
    } else if (/ - /.test(t) && !t.startsWith("- ")) {
      t.split(" - ").forEach(pushItem);
    } else if (t.startsWith("- ") || t.startsWith("* ") || t.startsWith("• ")) {
      pushItem(t.replace(/^[-*•]\s+/, ""));
    } else {
      pushItem(t);
    }
  });

  if (items.length === 0) return null;

  // Step 3: if only 1 item and it's not a heading, render as plain paragraph
  if (items.length === 1 && !items[0].heading) {
    return (
      <p
        className="rev-text"
        dangerouslySetInnerHTML={{ __html: applyInline(items[0].text) }}
      />
    );
  }

  // Step 4: render mixed headings + bullets
  return (
    <div className="rev-text-flow">
      {items.map((item, i) =>
        item.heading ? (
          <p
            key={i}
            className="rev-section-heading"
            dangerouslySetInnerHTML={{ __html: applyInline(item.text.replace(/:$/, "")) }}
          />
        ) : (
          <div key={i} className="rev-text-item">
            <span className="rev-text-dot" />
            <span dangerouslySetInnerHTML={{ __html: applyInline(item.text) }} />
          </div>
        )
      )}
    </div>
  );
}

// ── Checklist ─────────────────────────────────────────────────────────────────

function ChecklistItem({ text }: { text: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <motion.div
      className={`cl-item ${checked ? "checked" : ""}`}
      onClick={() => setChecked(v => !v)}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="cl-box"
        animate={{ background: checked ? "#6db88a" : "rgba(109,184,138,0)", borderColor: checked ? "#6db88a" : "var(--border2)" }}
      >
        {checked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span>}
      </motion.div>
      <span className={`cl-text ${checked ? "done" : ""}`}>{text}</span>
    </motion.div>
  );
}

// ── Exam question ─────────────────────────────────────────────────────────────

function ExamQuestionItem({ q, index }: { q: { question: string; hint: string }; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="eq-item">
      <div className="eq-header" onClick={() => setOpen(v => !v)}>
        <span className="eq-num">{index + 1}</span>
        <span className="eq-question">{q.question}</span>
        <span className={`eq-arrow ${open ? "open" : ""}`}>›</span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="eq-hint"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <span className="hint-label">💡 Hint</span>
            <p className="hint-text">{q.hint}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────

function RevisionCard({ meta, data, idx }: { meta: SectionMeta; data: RevisionData; idx: number }) {
  const value = data[meta.key];

  return (
    <motion.div
      id={meta.id}
      className="rev-card"
      style={{ "--rc-color": meta.color } as React.CSSProperties}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.07, ease: "easeOut" }}
      whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
    >
      <div className="rev-card-header">
        <span className="rev-card-icon">{meta.icon}</span>
        <span className="rev-card-title">{meta.label}</span>
      </div>

      <div className="rev-card-body">

        {(meta.key === "quick_revision" || meta.key === "detailed_revision") && (
          <RevisionText text={String(value)} />
        )}

        {meta.key === "cheat_sheet" && (
          <ul className="rev-bullets">
            {(value as string[]).map((item, i) => (
              <motion.li
                key={i} className="rev-bullet"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <span className="bullet-dot" style={{ background: meta.color }} />
                <span dangerouslySetInnerHTML={{ __html: applyInline(item) }} />
              </motion.li>
            ))}
          </ul>
        )}

        {meta.key === "common_mistakes" && (
          <ul className="rev-bullets">
            {(value as string[]).map((item, i) => (
              <motion.li
                key={i} className="rev-bullet mistake"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <span className="mistake-icon">⚠</span>
                <span dangerouslySetInnerHTML={{ __html: applyInline(item) }} />
              </motion.li>
            ))}
          </ul>
        )}

        {meta.key === "key_concepts" && (
          <div className="key-concepts-grid">
            {(value as { concept: string; definition: string }[]).map((kc, i) => (
              <motion.div
                key={i} className="kc-item"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.07 }}
              >
                <span className="kc-concept">{kc.concept}</span>
                <p className="kc-def">{kc.definition}</p>
              </motion.div>
            ))}
          </div>
        )}

        {meta.key === "memory_tricks" && (
          <div className="tricks-list">
            {(value as { trick: string; explanation: string }[]).map((m, i) => (
              <motion.div
                key={i} className="trick-item"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <div className="trick-badge">{m.trick}</div>
                <p className="trick-exp">{m.explanation}</p>
              </motion.div>
            ))}
          </div>
        )}

        {meta.key === "exam_questions" && (
          <div className="eq-list">
            {(value as { question: string; hint: string }[]).map((q, i) => (
              <ExamQuestionItem key={i} q={q} index={i} />
            ))}
          </div>
        )}

        {meta.key === "final_checklist" && (
          <div className="cl-list">
            {(value as string[]).map((item, i) => (
              <ChecklistItem key={i} text={item} />
            ))}
          </div>
        )}

      </div>
    </motion.div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export function RevisionTab({
  sessionId, userId, title, summary, notes,
  chapters, quiz, flashcards, cachedRevision,
}: {
  sessionId:       string;
  userId:          string;
  title?:          string;
  summary?:        string | null;
  notes?:          string | null;
  chapters?:       any;
  quiz?:           any;
  flashcards?:     any;
  cachedRevision?: any;
}) {
  const [revision,   setRevision]   = useState<RevisionData | null>(cachedRevision ?? null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");

  useEffect(() => {
    if (!revision && !loading) handleGenerate();
  }, [sessionId]);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const result = await generateRevisionAPI({
        sessionId, userId, difficulty,
        title: title ?? "", summary, notes,
        chapters, quiz, flashcards,
        cachedRevision: revision ?? cachedRevision ?? null,
      });
      setRevision(result);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Failed to generate revision. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <RevisionStyles />
      <div className="rev-root">

        <div className="rev-header">
          <div className="rev-header-left">
            <span className="rev-badge">⭐ Revision Mode</span>
            <p className="rev-sub">Exam-focused revision from your lecture</p>
          </div>
          {revision && !loading && (
            <div className="rev-header-right">
              <span className="rev-cached-tag">
                {revision.cached ? "✓ Loaded from cache" : "✓ Just generated"}
              </span>
              <div className="diff-pills">
                {(["beginner", "intermediate", "advanced"] as Difficulty[]).map(d => (
                  <motion.button
                    key={d}
                    className={`diff-pill ${difficulty === d ? "active" : ""}`}
                    style={{ "--dp-c": DIFFICULTY_META[d].color } as React.CSSProperties}
                    onClick={() => setDifficulty(d)}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                  >
                    {DIFFICULTY_META[d].emoji} {d}
                  </motion.button>
                ))}
                <motion.button
                  className="regen-btn" onClick={handleGenerate}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                >↺ Regenerate</motion.button>
              </div>
            </div>
          )}
        </div>

        {revision && !loading && (
          <div className="quick-jumps">
            {QUICK_JUMPS.map(j => (
              <motion.button
                key={j.id} className="qj-btn" onClick={() => scrollTo(j.id)}
                whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
              >{j.icon} {j.label}</motion.button>
            ))}
          </div>
        )}

        <div className="rev-content">
          {loading && (
            <motion.div className="rev-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="rev-loading-spinner"><div className="spinner-ring" /></div>
              <p className="rev-loading-title">Generating your revision package…</p>
              <p className="rev-loading-sub">Analysing summary, notes, chapters, quiz and flashcards</p>
              <div className="rev-loading-steps">
                {["Analysing lecture content","Building cheat sheet","Generating exam questions","Creating revision package"].map((s,i) => (
                  <motion.div key={i} className="loading-step"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                  >
                    <span className="loading-step-dot" />{s}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {error && !loading && (
            <motion.div className="rev-error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <span className="rev-error-icon">⚠️</span>
              <p className="rev-error-text">{error}</p>
              <motion.button className="rev-retry-btn" onClick={handleGenerate} whileHover={{ scale: 1.03 }}>
                Try Again
              </motion.button>
            </motion.div>
          )}

          {revision && !loading && (
            <div className="rev-sections">
              {SECTIONS.map((meta, idx) => (
                <RevisionCard key={meta.key} meta={meta} data={revision} idx={idx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function RevisionStyles() {
  return (
    <style>{`
      .rev-root { display: flex; flex-direction: column; gap: 18px; }

      .rev-header {
        display: flex; align-items: flex-start; justify-content: space-between;
        flex-wrap: wrap; gap: 14px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
      }
      .rev-header-left { display: flex; flex-direction: column; gap: 4px; }
      .rev-badge {
        font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em;
        color: var(--accent); background: rgba(200,169,110,0.12);
        border: 1px solid rgba(200,169,110,0.25); padding: 4px 10px; border-radius: 5px; display: inline-block;
      }
      .rev-sub { font-size: 13px; color: var(--muted); }
      .rev-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
      .rev-cached-tag { font-family: var(--font-mono); font-size: 10px; color: #6db88a; letter-spacing: 0.06em; }
      .diff-pills { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; }
      .diff-pill {
        padding: 5px 12px; border-radius: 16px; background: var(--surface2); border: 1px solid var(--border);
        font-size: 11px; color: var(--text2); cursor: pointer; text-transform: capitalize;
        font-family: var(--font-body); transition: all 0.15s;
      }
      .diff-pill.active { border-color: var(--dp-c); color: var(--dp-c); background: var(--surface); }
      .regen-btn {
        padding: 5px 12px; border-radius: 8px; background: transparent; border: 1px solid var(--border2);
        font-size: 11px; color: var(--text2); cursor: pointer; font-family: var(--font-body); transition: all 0.15s;
      }
      .regen-btn:hover { border-color: var(--accent); color: var(--accent); }

      .quick-jumps { display: flex; gap: 8px; flex-wrap: wrap; }
      .qj-btn {
        padding: 9px 16px; border-radius: 10px; background: var(--surface); border: 1px solid var(--border);
        font-size: 13px; color: var(--text2); cursor: pointer; font-family: var(--font-body); white-space: nowrap;
        transition: border-color 0.15s, color 0.15s;
      }
      .qj-btn:hover { border-color: var(--accent); color: var(--accent); }

      .rev-loading { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 48px 24px; text-align: center; }
      .rev-loading-spinner { width: 56px; height: 56px; }
      .spinner-ring {
        width: 56px; height: 56px; border-radius: 50%;
        border: 3px solid var(--border); border-top-color: var(--accent);
        animation: spin 1s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .rev-loading-title { font-size: 16px; font-weight: 500; color: var(--text); }
      .rev-loading-sub { font-size: 13px; color: var(--muted); }
      .rev-loading-steps { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; width: 100%; max-width: 340px; }
      .loading-step { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text2); }
      .loading-step-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; animation: pulse 1.5s ease-in-out infinite; }
      @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }

      .rev-error { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 24px; text-align: center; }
      .rev-error-icon { font-size: 32px; }
      .rev-error-text { font-size: 14px; color: var(--text2); }
      .rev-retry-btn {
        padding: 10px 24px; border-radius: 10px; background: var(--accent); border: none;
        color: #0a0a0c; font-size: 14px; font-family: var(--font-body); cursor: pointer;
      }

      .rev-sections { display: flex; flex-direction: column; gap: 14px; }

      .rev-card {
        background: var(--surface); border: 1px solid var(--border);
        border-left: 3px solid var(--rc-color); border-radius: 16px; padding: 22px 26px;
        transition: box-shadow 0.2s, transform 0.2s; scroll-margin-top: 80px;
      }
      .rev-card-header {
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border);
      }
      .rev-card-icon { font-size: 20px; }
      .rev-card-title { font-size: 15px; font-weight: 600; color: var(--rc-color); }

      /* ── RevisionText renderer ── */
      .rev-text {
        font-size: 14.5px; color: var(--text); line-height: 1.82; max-width: 72ch;
        margin: 0;
      }
      .rev-text strong { color: var(--text); font-weight: 600; }

      .rev-text-flow { display: flex; flex-direction: column; gap: 8px; }

      .rev-section-heading {
        font-size: 14px; font-weight: 600; color: var(--text);
        margin: 12px 0 2px; padding-bottom: 6px;
        border-bottom: 1px solid var(--border);
      }
      .rev-section-heading:first-child { margin-top: 0; }

      .rev-text-item {
        display: flex; align-items: flex-start; gap: 10px;
        font-size: 14.5px; color: var(--text); line-height: 1.75;
      }
      .rev-text-item strong { color: var(--text); font-weight: 600; }
      .rev-text-dot {
        width: 5px; height: 5px; border-radius: 50%;
        background: var(--border2); flex-shrink: 0; margin-top: 8px;
      }

      /* Bullets (cheat sheet / mistakes) */
      .rev-bullets { list-style: none; display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; }
      .rev-bullet {
        display: flex; align-items: flex-start; gap: 10px;
        font-size: 14px; color: var(--text); line-height: 1.65;
      }
      .rev-bullet strong { font-weight: 600; color: var(--text); }
      .bullet-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
      .rev-bullet.mistake { color: var(--text2); }
      .mistake-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }

      /* Key concepts */
      .key-concepts-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
      .kc-item { background: rgba(155,114,200,0.07); border: 1px solid rgba(155,114,200,0.2); border-radius: 10px; padding: 12px 14px; }
      .kc-concept { font-size: 13px; font-weight: 600; color: #9b72c8; display: block; margin-bottom: 5px; }
      .kc-def { font-size: 13px; color: var(--text2); line-height: 1.6; margin: 0; }

      /* Memory tricks */
      .tricks-list { display: flex; flex-direction: column; gap: 12px; }
      .trick-item { background: rgba(200,122,58,0.07); border: 1px solid rgba(200,122,58,0.2); border-radius: 10px; padding: 12px 16px; }
      .trick-badge { font-size: 13px; font-weight: 700; color: #c87a3a; font-family: var(--font-mono); margin-bottom: 6px; }
      .trick-exp { font-size: 13px; color: var(--text2); line-height: 1.6; margin: 0; }

      /* Exam questions */
      .eq-list { display: flex; flex-direction: column; gap: 8px; }
      .eq-item { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
      .eq-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; transition: background 0.12s; }
      .eq-header:hover { background: var(--surface); }
      .eq-num {
        width: 22px; height: 22px; border-radius: 6px;
        background: rgba(58,188,200,0.15); border: 1px solid rgba(58,188,200,0.3);
        color: #3abcc8; font-family: var(--font-mono); font-size: 10px; font-weight: 600;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .eq-question { flex: 1; font-size: 14px; color: var(--text); line-height: 1.5; }
      .eq-arrow { color: var(--muted); font-size: 16px; transition: transform 0.2s; flex-shrink: 0; }
      .eq-arrow.open { transform: rotate(90deg); }
      .eq-hint { padding: 12px 16px; background: rgba(58,188,200,0.06); border-top: 1px solid var(--border); overflow: hidden; }
      .hint-label { font-family: var(--font-mono); font-size: 10px; color: #3abcc8; letter-spacing: 0.08em; display: block; margin-bottom: 6px; }
      .hint-text { font-size: 13px; color: var(--text2); line-height: 1.65; margin: 0; }

      /* Checklist */
      .cl-list { display: flex; flex-direction: column; gap: 10px; }
      .cl-item {
        display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 9px;
        border: 1px solid var(--border); cursor: pointer; background: var(--surface2);
        transition: border-color 0.15s, background 0.15s;
      }
      .cl-item:hover { border-color: #6db88a; }
      .cl-item.checked { border-color: #6db88a; background: rgba(109,184,138,0.08); }
      .cl-box {
        width: 20px; height: 20px; border-radius: 5px; flex-shrink: 0; border: 2px solid;
        display: flex; align-items: center; justify-content: center; font-size: 11px; color: #0a0a0c; transition: all 0.2s;
      }
      .cl-text { font-size: 13.5px; color: var(--text); line-height: 1.5; transition: color 0.15s; }
      .cl-text.done { color: var(--muted); text-decoration: line-through; }

      @media (max-width: 640px) {
        .rev-card { padding: 14px 16px; }
        .rev-header { flex-direction: column; }
        .rev-header-right { align-items: flex-start; }
        .key-concepts-grid { grid-template-columns: 1fr; }
        .qj-btn { font-size: 12px; padding: 7px 12px; }
      }
    `}</style>
  );
}