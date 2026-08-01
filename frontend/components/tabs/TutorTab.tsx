"use client";

import {
  useState, useRef, useEffect, useCallback, createRef,
} from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { askTutorAPI, TutorResponse } from "@/lib/api-client";
import {
  saveTutorMessageAction,
  getTutorHistoryAction,
} from "@/actions/tutor.actions";
import { Chapter, Segment } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = "beginner" | "intermediate" | "advanced";

interface TutorMessage {
  id:      string;
  role:    "user" | "assistant";
  content: {
    question?:      string;
    difficulty?:    Difficulty;
    chapterTitle?:  string;
  } & Partial<TutorResponse>;
}

const SECTIONS = [
  "concept", "example", "analogy",
  "key_takeaways", "practice_question", "follow_up",
] as const;
type SectionKey = typeof SECTIONS[number];

// ─── Design tokens ────────────────────────────────────────────────────────────

const CARD_COLORS: Record<SectionKey, {
  border: string; glow: string; icon: string; label: string; accent: string;
}> = {
  concept:           { border: "#4a9cc8", glow: "rgba(74,156,200,0.12)",  icon: "📚", label: "Concept",            accent: "#4a9cc8" },
  example:           { border: "#5aab72", glow: "rgba(90,171,114,0.12)",  icon: "💡", label: "Practical Example",   accent: "#5aab72" },
  analogy:           { border: "#9b72c8", glow: "rgba(155,114,200,0.12)", icon: "🧠", label: "Real-world Analogy",  accent: "#9b72c8" },
  key_takeaways:     { border: "#c8a032", glow: "rgba(200,160,50,0.12)",  icon: "📝", label: "Key Takeaways",       accent: "#c8a032" },
  practice_question: { border: "#c87a3a", glow: "rgba(200,122,58,0.12)", icon: "🎯", label: "Practice Question",   accent: "#c87a3a" },
  follow_up:         { border: "#3abcc8", glow: "rgba(58,188,200,0.12)",  icon: "🔍", label: "Explore Further",     accent: "#3abcc8" },
};

const DIFFICULTY_META: Record<Difficulty, { color: string; label: string; emoji: string }> = {
  beginner:     { color: "#5aab72", label: "Beginner",     emoji: "🌱" },
  intermediate: { color: "#c8a96e", label: "Intermediate", emoji: "🔥" },
  advanced:     { color: "#c96e6e", label: "Advanced",     emoji: "⚡" },
};

// ─── Quick-action presets ─────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { emoji: "🔄", label: "Explain Simpler",          prompt: "Can you explain this more simply?" },
  { emoji: "🎨", label: "Another Analogy",           prompt: "Give me a completely different real-world analogy for this concept." },
  { emoji: "📚", label: "More Examples",             prompt: "Give me more practical examples of this concept." },
  { emoji: "👶", label: "Explain Like I'm 10",      prompt: "Explain this concept as if I'm 10 years old with no prior knowledge." },
  { emoji: "🧪", label: "Challenge Me",              prompt: "Give me a harder, more challenging practice question on this topic." },
  { emoji: "📈", label: "Real World Application",   prompt: "How is this concept used in the real world? Give a specific application." },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function estimateReadingTime(r: Partial<TutorResponse>): number {
  const text = [
    r.concept, r.example, r.analogy,
    ...(r.key_takeaways ?? []),
    r.practice_question,
  ].filter(Boolean).join(" ");
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
}

function extractKeywords(text: string): string[] {
  const phrases = text.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})+/g) ?? [];
  const singles = text.match(/\b[A-Z]{3,}\b/g) ?? [];
  return [...new Set([...phrases, ...singles])].slice(0, 7);
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .reduce<string[]>((acc, s, i) => {
      if (i % 3 === 0) acc.push(s);
      else acc[acc.length - 1] += " " + s;
      return acc;
    }, [])
    .filter(Boolean);
}

function highlightKeywords(text: string, kws: string[]): React.ReactNode {
  if (!kws.length) return text;
  const re = new RegExp(`(${kws.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return text.split(re).map((p, i) =>
    kws.includes(p) ? <mark key={i} className="kw-pill">{p}</mark> : p
  );
}

function estimatedMastery(r: Partial<TutorResponse>, difficulty: Difficulty): number {
  const base = { beginner: 85, intermediate: 78, advanced: 70 }[difficulty];
  const hasAll = !!(r.concept && r.example && r.analogy && r.key_takeaways?.length && r.practice_question);
  return hasAll ? base + 5 : base;
}

// ─── Animation presets ────────────────────────────────────────────────────────

const cardVariants: Record<SectionKey, object> = {
  concept:           { hidden: { opacity: 0, y: 24 },         visible: { opacity: 1, y: 0,     transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } } },
  example:           { hidden: { opacity: 0, x: -20 },        visible: { opacity: 1, x: 0,     transition: { duration: 0.4,  ease: "easeOut" } } },
  analogy:           { hidden: { opacity: 0, scale: 0.94 },   visible: { opacity: 1, scale: 1, transition: { duration: 0.4,  ease: "easeOut" } } },
  key_takeaways:     { hidden: { opacity: 0, x: 20 },         visible: { opacity: 1, x: 0,     transition: { duration: 0.4,  ease: "easeOut" } } },
  practice_question: { hidden: { opacity: 0, scale: 0.9 },    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 250, damping: 22 } } },
  follow_up:         { hidden: { opacity: 0, y: 16 },         visible: { opacity: 1, y: 0,     transition: { duration: 0.4,  ease: "easeOut" } } },
};

// ─── Roadmap Component ────────────────────────────────────────────────────────

function LessonRoadmap({
  sectionList,
  revealed,
  sectionRefs,
}: {
  sectionList: SectionKey[];
  revealed:    number;
  sectionRefs: React.RefObject<HTMLDivElement | null>[];
}) {
  function scrollTo(idx: number) {
    if (idx < revealed && sectionRefs[idx]?.current) {
      sectionRefs[idx].current!.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="roadmap">
      {sectionList.map((sk, idx) => {
        const done    = idx < revealed;
        const current = idx === revealed - 1;
        const locked  = idx >= revealed;
        const c       = CARD_COLORS[sk];

        return (
          <div key={sk} className="roadmap-step" style={{ "--step-color": c.accent } as React.CSSProperties}>
            <button
              className={`roadmap-dot ${done ? "done" : ""} ${current ? "current" : ""} ${locked ? "locked" : ""}`}
              onClick={() => scrollTo(idx)}
              title={done ? `Go back to ${c.label}` : c.label}
              disabled={locked}
            >
              {done ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >✓</motion.span>
              ) : (
                <span className="roadmap-dot-num">{idx + 1}</span>
              )}
            </button>
            <span className={`roadmap-label ${current ? "current" : ""} ${locked ? "locked" : ""}`}>
              {c.icon} {c.label}
            </span>
            {idx < sectionList.length - 1 && (
              <div className={`roadmap-connector ${idx < revealed - 1 ? "filled" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sticky Navigator ─────────────────────────────────────────────────────────

function StickyNav({
  sectionList,
  revealed,
  sectionRefs,
  question,
}: {
  sectionList:  SectionKey[];
  revealed:     number;
  sectionRefs:  React.RefObject<HTMLDivElement | null>[];
  question:     string;
}) {
  const progress = Math.round((Math.min(revealed, sectionList.length) / sectionList.length) * 100);

  return (
    <motion.div
      className="sticky-nav"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="sticky-nav-inner">
        <span className="sticky-question" title={question}>
          {question.length > 48 ? question.slice(0, 48) + "…" : question}
        </span>
        <div className="sticky-dots">
          {sectionList.map((sk, idx) => (
            <button
              key={sk}
              className={`sticky-dot ${idx < revealed ? "done" : idx === revealed ? "next" : ""}`}
              onClick={() => idx < revealed && sectionRefs[idx]?.current?.scrollIntoView({ behavior: "smooth" })}
              title={CARD_COLORS[sk].label}
              style={{ "--dot-c": CARD_COLORS[sk].accent } as React.CSSProperties}
            />
          ))}
        </div>
        <span className="sticky-pct">{progress}%</span>
      </div>
      <motion.div
        className="sticky-bar"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </motion.div>
  );
}

// ─── Lesson Header ────────────────────────────────────────────────────────────

function LessonHeader({
  question,
  difficulty,
  chapterTitle,
  readTime,
  sectionList,
  revealed,
  sectionRefs,
}: {
  question:     string;
  difficulty:   Difficulty;
  chapterTitle?: string;
  readTime:     number;
  sectionList:  SectionKey[];
  revealed:     number;
  sectionRefs:  React.RefObject<HTMLDivElement | null>[];
}) {
  const dm       = DIFFICULTY_META[difficulty];
  const progress = Math.round((Math.min(revealed, sectionList.length) / sectionList.length) * 100);

  return (
    <motion.div
      className="lesson-header"
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top row */}
      <div className="lh-top">
        <span className="lh-badge">🧑‍🏫 AI Tutor</span>
        <div className="lh-meta">
          <span className="lh-tag" style={{ color: dm.color }}>
            {dm.emoji} {dm.label}
          </span>
          {chapterTitle && (
            <span className="lh-tag">📖 {chapterTitle}</span>
          )}
          <span className="lh-tag">⏱ ~{readTime} min</span>
        </div>
      </div>

      {/* Lesson title */}
      <h2 className="lh-title">Today's Lesson</h2>
      <p className="lh-question">"{question}"</p>

      {/* Progress bar */}
      <div className="lh-progress-wrap">
        <div className="lh-progress-row">
          <span className="lh-progress-label">Lesson Progress</span>
          <span className="lh-progress-pct">{progress}%</span>
        </div>
        <div className="lh-track">
          <motion.div
            className="lh-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Interactive roadmap */}
      <LessonRoadmap
        sectionList={sectionList}
        revealed={revealed}
        sectionRefs={sectionRefs}
      />
    </motion.div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  sectionKey,
  response,
  difficulty,
  keywords,
  cardRef,
  onFollowUp,
  onExplainAgain,
}: {
  sectionKey:      SectionKey;
  response:        TutorResponse;
  difficulty:      Difficulty;
  keywords:        string[];
  cardRef:         React.RefObject<HTMLDivElement | null>;
  onFollowUp:      (q: string) => void;
  onExplainAgain:  () => void;
}) {
  const c = CARD_COLORS[sectionKey];

  return (
    <motion.div
      ref={cardRef}
      className={`lesson-card lc-${sectionKey}`}
      variants={cardVariants[sectionKey] as any}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, boxShadow: `0 8px 32px ${c.glow}` }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{ "--lc-border": c.border, "--lc-glow": c.glow, "--lc-accent": c.accent } as React.CSSProperties}
    >
      <div className="lc-header">
        <div className="lc-title-row">
          <span className="lc-icon">{c.icon}</span>
          <span className="lc-title">{c.label}</span>
        </div>
      </div>

      <div className="lc-body">

        {sectionKey === "concept" && (
          <ConceptBody text={response.concept} keywords={keywords} />
        )}

        {sectionKey === "example" && (
          <div className="example-body">
            <div className="example-quote">
              {splitIntoParagraphs(response.example).map((p, i) => (
                <p key={i} className="body-para">{p}</p>
              ))}
            </div>
          </div>
        )}

        {sectionKey === "analogy" && (
          <div className="analogy-body">
            <div className="analogy-think">Think of it this way…</div>
            {splitIntoParagraphs(response.analogy).map((p, i) => (
              <p key={i} className="body-para analogy-text">{p}</p>
            ))}
          </div>
        )}

        {sectionKey === "key_takeaways" && (
          <ul className="takeaways-list">
            {(response.key_takeaways ?? []).map((t, i) => (
              <motion.li
                key={i}
                className="takeaway-row"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.09 }}
              >
                <span className="takeaway-check">✔</span>
                <span className="takeaway-text">{t}</span>
              </motion.li>
            ))}
          </ul>
        )}

        {sectionKey === "practice_question" && (
          <PracticeCard
            question={response.practice_question}
            concept={response.concept}
            onExplainAgain={onExplainAgain}
          />
        )}

        {sectionKey === "follow_up" && (
          <FollowUpList questions={response.follow_up_questions ?? []} onAsk={onFollowUp} />
        )}

      </div>
    </motion.div>
  );
}

// ─── Concept body (keyword highlighting + paragraphs) ─────────────────────────

function ConceptBody({ text, keywords }: { text: string; keywords: string[] }) {
  const paragraphs = splitIntoParagraphs(text);
  return (
    <div className="concept-body">
      {paragraphs.map((p, i) => (
        <p key={i} className="body-para">
          {highlightKeywords(p, keywords)}
        </p>
      ))}
      {keywords.length > 0 && (
        <div className="kw-shelf">
          <span className="kw-shelf-label">Key Terms</span>
          <div className="kw-chips-row">
            {keywords.map((kw) => (
              <span key={kw} className="kw-badge">{kw}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Practice Card ────────────────────────────────────────────────────────────

function PracticeCard({
  question,
  concept,
  onExplainAgain,
}: {
  question:      string;
  concept:       string;
  onExplainAgain:() => void;
}) {
  const [stage, setStage] = useState<"question" | "hint" | "answer" | "eval">("question");
  const hint = concept.split(".")[0] + "." ;
  const suggestedAnswer = concept.split(".").slice(0, 2).join(".") + ".";

  return (
    <div className="practice-body">
      <p className="practice-q">{question}</p>

      {stage === "question" && (
        <div className="practice-actions">
          <motion.button
            className="prac-btn hint"
            onClick={() => setStage("hint")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >💡 Show Hint</motion.button>
          <motion.button
            className="prac-btn reveal"
            onClick={() => setStage("answer")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >👁 Reveal Answer</motion.button>
        </div>
      )}

      {stage === "hint" && (
        <motion.div
          className="practice-hint"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <div className="hint-label">💡 Hint</div>
          <p className="hint-text">{hint}</p>
          <motion.button
            className="prac-btn reveal"
            onClick={() => setStage("answer")}
            whileHover={{ scale: 1.02 }}
          >👁 Reveal Answer</motion.button>
        </motion.div>
      )}

      {stage === "answer" && (
        <motion.div
          className="practice-answer"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <div className="answer-label">✅ Suggested Answer</div>
          <p className="answer-text">{suggestedAnswer}</p>
          <div className="eval-label">How did you do?</div>
          <div className="eval-btns">
            <motion.button
              className="eval-btn understood"
              onClick={() => setStage("eval")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >✓ I Got It</motion.button>
            <motion.button
              className="eval-btn again"
              onClick={() => { setStage("eval"); onExplainAgain(); }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >✗ Explain Again</motion.button>
          </div>
        </motion.div>
      )}

      {stage === "eval" && (
        <motion.div className="eval-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span>🎉 Keep it up!</span>
        </motion.div>
      )}
    </div>
  );
}

// ─── Follow-up list ───────────────────────────────────────────────────────────

function FollowUpList({ questions, onAsk }: { questions: string[]; onAsk: (q: string) => void }) {
  return (
    <div className="followup-grid">
      {questions.map((q, i) => (
        <motion.button
          key={i}
          className="followup-card"
          onClick={() => onAsk(q)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ x: 4, borderColor: "#3abcc8" }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="followup-arrow">→</span>
          <span className="followup-text">{q}</span>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions({ onAction }: { onAction: (prompt: string) => void }) {
  return (
    <motion.div
      className="quick-actions"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="qa-label">Quick Actions</div>
      <div className="qa-grid">
        {QUICK_ACTIONS.map((a) => (
          <motion.button
            key={a.label}
            className="qa-btn"
            onClick={() => onAction(a.prompt)}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="qa-emoji">{a.emoji}</span>
            <span className="qa-label-text">{a.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Lesson Complete ──────────────────────────────────────────────────────────

function LessonComplete({
  response,
  difficulty,
  onContinue,
}: {
  response:   TutorResponse;
  difficulty: Difficulty;
  onContinue: () => void;
}) {
  const mastery   = estimatedMastery(response, difficulty);
  const dm        = DIFFICULTY_META[difficulty];
  const takeaways = response.key_takeaways?.slice(0, 4) ?? [];

  return (
    <motion.div
      className="lesson-complete"
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      <div className="lc-confetti">🎉</div>
      <h3 className="lc-title">Lesson Complete!</h3>
      <p className="lc-sub">Here's what you covered in this lesson:</p>

      {takeaways.length > 0 && (
        <ul className="lc-points">
          {takeaways.map((t, i) => (
            <motion.li
              key={i}
              className="lc-point"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <span className="lc-check">✓</span>
              <span>{t}</span>
            </motion.li>
          ))}
        </ul>
      )}

      <div className="lc-stats">
        <div className="lc-stat">
          <span className="lc-stat-label">Difficulty</span>
          <span className="lc-stat-value" style={{ color: dm.color }}>
            {dm.emoji} {dm.label}
          </span>
        </div>
        <div className="lc-stat">
          <span className="lc-stat-label">Estimated Mastery</span>
          <div className="mastery-wrap">
            <div className="mastery-track">
              <motion.div
                className="mastery-fill"
                initial={{ width: 0 }}
                animate={{ width: `${mastery}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              />
            </div>
            <span className="mastery-pct">{mastery}%</span>
          </div>
        </div>
      </div>

      <motion.button
        className="lc-continue"
        onClick={onContinue}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        Continue Learning →
      </motion.button>
    </motion.div>
  );
}

// ─── Lesson View (orchestrates one full tutor response) ───────────────────────

function LessonView({
  msg,
  onFollowUp,
}: {
  msg:        TutorMessage;
  onFollowUp: (q: string) => void;
}) {
  const response    = msg.content as TutorResponse;
  const difficulty  = (msg.content.difficulty as Difficulty) ?? "beginner";
  const chapterTitle= msg.content.chapterTitle;
  const question    = msg.content.question ?? "";
  const readTime    = estimateReadingTime(response);
  const keywords    = extractKeywords(response.concept ?? "");

  const sectionList = SECTIONS.filter((sk) => {
    if (sk === "key_takeaways")    return (response.key_takeaways?.length ?? 0) > 0;
    if (sk === "practice_question") return !!response.practice_question;
    if (sk === "follow_up")        return (response.follow_up_questions?.length ?? 0) > 0;
    return !!response[sk as keyof TutorResponse];
  });

  const [revealed, setReveal] = useState(1);
  const [done,     setDone]   = useState(false);
  const [showNav,  setShowNav] = useState(false);

  const sectionRefs = sectionList.map(() => createRef<HTMLDivElement>());
  const wrapRef     = useRef<HTMLDivElement>(null);

  // Sticky nav visibility
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setShowNav(!e.isIntersecting), { threshold: 0.1 });
    const header = el.querySelector(".lesson-header") as Element;
    if (header) obs.observe(header);
    return () => obs.disconnect();
  }, []);

  function handleExplainAgain() {
    onFollowUp("Can you explain this concept again more simply, step by step?");
  }

  function handleContinue() {
    if (revealed < sectionList.length) {
      setReveal((r) => r + 1);
      setTimeout(() => sectionRefs[revealed]?.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } else {
      setDone(true);
    }
  }

  return (
    <div className="lesson-view" ref={wrapRef}>
      {/* Sticky navigator */}
      <AnimatePresence>
        {showNav && revealed > 1 && (
          <StickyNav
            sectionList={sectionList}
            revealed={revealed}
            sectionRefs={sectionRefs}
            question={question}
          />
        )}
      </AnimatePresence>

      {/* Lesson header */}
      <LessonHeader
        question={question}
        difficulty={difficulty}
        chapterTitle={chapterTitle}
        readTime={readTime}
        sectionList={sectionList}
        revealed={revealed}
        sectionRefs={sectionRefs}
      />

      {/* Section cards */}
      <div className="lesson-cards">
        <AnimatePresence initial={false}>
          {sectionList.slice(0, revealed).map((sk, idx) => (
            <SectionCard
              key={sk}
              sectionKey={sk}
              response={response}
              difficulty={difficulty}
              keywords={keywords}
              cardRef={sectionRefs[idx]}
              onFollowUp={onFollowUp}
              onExplainAgain={handleExplainAgain}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Continue / Complete */}
      {!done && (
        revealed < sectionList.length ? (
          <motion.div
            className="continue-row"
            key={`cont-${revealed}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <motion.button
              className="continue-btn"
              onClick={handleContinue}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>Continue</span>
              <span className="continue-next-label">
                {CARD_COLORS[sectionList[revealed]].icon} {CARD_COLORS[sectionList[revealed]].label}
              </span>
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            className="finish-btn"
            onClick={() => setDone(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
          >🎓 Complete Lesson</motion.button>
        )
      )}

      {done && (
        <LessonComplete response={response} difficulty={difficulty} onContinue={() => setDone(false)} />
      )}

      {/* Quick Actions */}
      <QuickActions onAction={onFollowUp} />
    </div>
  );
}

// ─── Main TutorTab ────────────────────────────────────────────────────────────

export function TutorTab({
  sessionId,
  chapters,
  segments,
  onSeek,
}: {
  sessionId: string;
  chapters?: any;
  segments?: any;
  onSeek:    (t: number) => void;
}) {
  const chapterList = (chapters as Chapter[]) ?? [];
  const segmentList = (segments as Segment[]) ?? [];

  const [messages,       setMessages]       = useState<TutorMessage[]>([]);
  const [input,          setInput]          = useState("");
  const [difficulty,     setDifficulty]     = useState<Difficulty>("beginner");
  const [chapterIdx,     setChapterIdx]     = useState<number | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const h = await getTutorHistoryAction(sessionId);
        setMessages(h.map((m: any) => ({ id: uid(), role: m.role, content: m.content })));
      } catch {}
      finally { setLoadingHistory(false); }
    }
    load();
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const selectedChapter = chapterIdx !== null ? chapterList[chapterIdx] : null;

  const askTutor = useCallback(async (question: string) => {
    if (!question.trim() || loading) return;
    setInput("");

    const userContent = { question, difficulty, chapterTitle: selectedChapter?.title };
    const userMsg: TutorMessage = { id: uid(), role: "user", content: userContent };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const result = await askTutorAPI({
        sessionId,
        question,
        difficulty,
        chapter: selectedChapter
          ? { title: selectedChapter.title, start: selectedChapter.start, end: selectedChapter.end, summary: selectedChapter.summary }
          : null,
        allSegments: segmentList,
      });

      const assistantContent = { ...result, question, difficulty, chapterTitle: selectedChapter?.title };
      setMessages((m) => [...m, { id: uid(), role: "assistant", content: assistantContent }]);

      await saveTutorMessageAction(sessionId, "user", userContent);
      await saveTutorMessageAction(sessionId, "assistant", assistantContent as any);

    } catch {
      setMessages((m) => [...m, {
        id: uid(), role: "assistant",
        content: { concept: "Something went wrong. Please try again.", key_takeaways: [], follow_up_questions: [], question, difficulty },
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, difficulty, selectedChapter, sessionId, segmentList]);

  return (
    <>
      <TutorStyles />
      <div className="tutor-root">

        {/* Controls */}
        <div className="tutor-controls">
          <div className="ctrl-group">
            <span className="ctrl-label">Difficulty</span>
            <div className="diff-pills">
              {(["beginner", "intermediate", "advanced"] as Difficulty[]).map((d) => {
                const dm = DIFFICULTY_META[d];
                return (
                  <motion.button
                    key={d}
                    className={`diff-pill ${difficulty === d ? "active" : ""}`}
                    style={{ "--dp-color": dm.color } as React.CSSProperties}
                    onClick={() => setDifficulty(d)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {dm.emoji} {dm.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {chapterList.length > 0 && (
            <div className="ctrl-group">
              <span className="ctrl-label">Chapter Scope</span>
              <select
                className="chapter-sel"
                value={chapterIdx ?? ""}
                onChange={(e) => setChapterIdx(e.target.value === "" ? null : Number(e.target.value))}
              >
                <option value="">📹 Whole Video</option>
                {chapterList.map((c, i) => (
                  <option key={i} value={i}>📖 {c.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className="tutor-convo">
          {loadingHistory && (
            <p className="tutor-loading">Loading previous lessons…</p>
          )}

          {!loadingHistory && messages.length === 0 && (
            <motion.div
              className="tutor-welcome"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="welcome-icon">🧑‍🏫</div>
              <h2 className="welcome-title">Your AI Tutor</h2>
              <p className="welcome-sub">
                Ask anything about this lecture. You'll receive a structured lesson with
                concept explanation, analogy, examples, key takeaways, and a practice question.
              </p>
              <div className="welcome-starters">
                {[
                  "Explain the main concept of this lecture",
                  "What is the most important idea I should understand?",
                  "Give me a beginner-friendly overview of this video",
                ].map((q, i) => (
                  <motion.button
                    key={i}
                    className="starter-btn"
                    onClick={() => askTutor(q)}
                    whileHover={{ x: 4, borderColor: "#c8a96e" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="starter-arrow">→</span>{q}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Render message pairs */}
          {messages.reduce<React.ReactNode[]>((acc, msg, i) => {
            if (msg.role === "user") {
              acc.push(
                <motion.div
                  key={msg.id}
                  className="user-turn"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="user-bubble">{msg.content.question}</div>
                  <span className="user-meta">
                    {DIFFICULTY_META[(msg.content.difficulty as Difficulty) ?? "beginner"].emoji}{" "}
                    {DIFFICULTY_META[(msg.content.difficulty as Difficulty) ?? "beginner"].label}
                    {msg.content.chapterTitle ? ` · ${msg.content.chapterTitle}` : ""}
                  </span>
                </motion.div>
              );
            } else {
              acc.push(
                <LessonView key={msg.id} msg={msg} onFollowUp={askTutor} />
              );
            }
            return acc;
          }, [])}

          {loading && (
            <motion.div
              className="tutor-generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="gen-dots">
                <span /><span /><span />
              </div>
              <p className="gen-text">Preparing your lesson…</p>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="tutor-input-row">
          <input
            className="tutor-input"
            placeholder={
              selectedChapter
                ? `Ask about "${selectedChapter.title}"…`
                : "Ask your AI tutor anything about this video…"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && askTutor(input)}
            disabled={loading}
          />
          <motion.button
            className="tutor-send"
            onClick={() => askTutor(input)}
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
          >
            {loading ? <span className="spin">⟳</span> : "→"}
          </motion.button>
        </div>

      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function TutorStyles() {
  return (
    <style>{`
      /* ── Root layout ── */
      .tutor-root {
        display: flex; flex-direction: column;
        height: calc(100vh - 360px); min-height: 520px;
      }

      /* ── Controls ── */
      .tutor-controls {
        display: flex; gap: 24px; align-items: flex-end; flex-wrap: wrap;
        padding-bottom: 14px; border-bottom: 1px solid var(--border);
        margin-bottom: 18px; flex-shrink: 0;
      }
      .ctrl-group { display: flex; flex-direction: column; gap: 6px; }
      .ctrl-label {
        font-family: var(--font-mono); font-size: 10px;
        letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted);
      }
      .diff-pills { display: flex; gap: 5px; }
      .diff-pill {
        padding: 7px 14px; border-radius: 20px;
        background: var(--surface2); border: 1px solid var(--border);
        font-size: 12px; color: var(--text2); cursor: pointer;
        font-family: var(--font-body); transition: all 0.15s;
      }
      .diff-pill.active {
        border-color: var(--dp-color); color: var(--dp-color);
        background: var(--surface);
      }
      .chapter-sel {
        padding: 7px 12px; border-radius: 9px;
        background: var(--surface2); border: 1px solid var(--border);
        font-size: 13px; color: var(--text); min-width: 200px;
        font-family: var(--font-body); outline: none; cursor: pointer;
      }
      .chapter-sel:focus { border-color: var(--accent); }

      /* ── Conversation ── */
      .tutor-convo {
        flex: 1; overflow-y: auto;
        display: flex; flex-direction: column; gap: 32px;
        padding-bottom: 12px; padding-right: 4px;
      }
      .tutor-convo::-webkit-scrollbar { width: 4px; }
      .tutor-convo::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      .tutor-loading { color: var(--muted); font-size: 13px; text-align: center; padding: 24px; }

      /* ── Welcome ── */
      .tutor-welcome {
        display: flex; flex-direction: column;
        align-items: center; text-align: center; gap: 12px; padding: 40px 16px;
      }
      .welcome-icon { font-size: 44px; margin-bottom: 4px; }
      .welcome-title {
        font-family: var(--font-display); font-size: 24px;
        letter-spacing: -0.02em; color: var(--text);
      }
      .welcome-sub { font-size: 14px; color: var(--text2); max-width: 400px; line-height: 1.7; }
      .welcome-starters { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 420px; margin-top: 8px; }
      .starter-btn {
        padding: 11px 16px; border-radius: 11px;
        background: var(--surface); border: 1px solid var(--border);
        font-size: 13px; color: var(--text2); cursor: pointer; text-align: left;
        font-family: var(--font-body); display: flex; align-items: center; gap: 8px;
        transition: all 0.15s;
      }
      .starter-arrow { color: var(--accent); flex-shrink: 0; }

      /* ── User turn ── */
      .user-turn { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
      .user-bubble {
        background: var(--accent); color: #0a0a0c;
        padding: 12px 18px; border-radius: 18px 18px 4px 18px;
        font-size: 14px; max-width: 72%; line-height: 1.55;
        font-weight: 400;
      }
      .user-meta {
        font-family: var(--font-mono); font-size: 10px;
        color: var(--muted); text-transform: capitalize;
      }

      /* ── Lesson View ── */
      .lesson-view { display: flex; flex-direction: column; gap: 16px; position: relative; }

      /* ── Lesson Header ── */
      .lesson-header {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 16px; padding: 20px 24px;
      }
      .lh-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
      .lh-badge {
        font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em;
        color: var(--accent); background: rgba(200,169,110,0.12);
        border: 1px solid rgba(200,169,110,0.25); padding: 4px 10px; border-radius: 5px;
      }
      .lh-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .lh-tag { font-size: 12px; color: var(--text2); font-family: var(--font-mono); }
      .lh-title {
        font-family: var(--font-display); font-size: 11px; letter-spacing: 0.1em;
        text-transform: uppercase; color: var(--muted); margin: 0 0 4px;
      }
      .lh-question {
        font-size: 16px; font-weight: 500; color: var(--text);
        line-height: 1.45; margin-bottom: 18px;
        font-style: italic;
      }
      .lh-progress-wrap { margin-bottom: 16px; }
      .lh-progress-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
      .lh-progress-label { font-family: var(--font-mono); font-size: 10px; color: var(--muted); letter-spacing: 0.06em; }
      .lh-progress-pct { font-family: var(--font-mono); font-size: 10px; color: var(--accent); }
      .lh-track { height: 5px; background: var(--border); border-radius: 3px; overflow: hidden; }
      .lh-fill { height: 100%; background: linear-gradient(90deg, #4a9cc8, var(--accent)); border-radius: 3px; }

      /* ── Roadmap ── */
      .roadmap { display: flex; align-items: flex-start; gap: 0; margin-top: 4px; flex-wrap: wrap; gap-y: 8px; }
      .roadmap-step { display: flex; align-items: center; gap: 0; }
      .roadmap-dot {
        width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
        background: var(--surface2); border: 2px solid var(--border);
        font-size: 11px; color: var(--muted); cursor: default;
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-mono); transition: all 0.2s;
      }
      .roadmap-dot.done { background: var(--step-color); border-color: var(--step-color); color: #0a0a0c; cursor: pointer; }
      .roadmap-dot.current { border-color: var(--step-color); color: var(--step-color); }
      .roadmap-dot.locked { opacity: 0.4; }
      .roadmap-dot-num { font-size: 10px; }
      .roadmap-label {
        display: none;
      }
      .roadmap-connector {
        width: 20px; height: 2px; background: var(--border);
        flex-shrink: 0; transition: background 0.3s;
      }
      .roadmap-connector.filled { background: var(--accent); }
      @media (min-width: 600px) {
        .roadmap-label {
          display: block; font-size: 10px; color: var(--muted);
          font-family: var(--font-mono); white-space: nowrap;
          margin: 0 4px; transition: color 0.2s;
        }
        .roadmap-label.current { color: var(--text); }
        .roadmap-label.locked  { opacity: 0.4; }
        .roadmap-connector { width: 14px; }
      }

      /* ── Sticky Nav ── */
      .sticky-nav {
        position: sticky; top: 0; z-index: 20;
        background: rgba(20, 20, 24, 0.92);
        backdrop-filter: blur(12px);
        border: 1px solid var(--border); border-radius: 10px;
        overflow: hidden; margin-bottom: 4px;
      }
      .sticky-nav-inner {
        display: flex; align-items: center; gap: 12px; padding: 8px 14px;
      }
      .sticky-question {
        font-size: 12px; color: var(--text2); flex: 1; min-width: 0;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        font-style: italic;
      }
      .sticky-dots { display: flex; gap: 5px; }
      .sticky-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: var(--border2); border: none; padding: 0; cursor: default;
        transition: background 0.2s;
      }
      .sticky-dot.done { background: var(--dot-c); cursor: pointer; }
      .sticky-dot.next { background: var(--border2); border: 1px solid var(--dot-c); }
      .sticky-pct { font-family: var(--font-mono); font-size: 10px; color: var(--accent); flex-shrink: 0; }
      .sticky-bar { height: 2px; background: linear-gradient(90deg, #4a9cc8, var(--accent)); }

      /* ── Cards ── */
      .lesson-cards { display: flex; flex-direction: column; gap: 14px; }
      .lesson-card {
        background: var(--surface); border: 1px solid var(--border);
        border-left: 3px solid var(--lc-border);
        border-radius: 16px; padding: 22px 26px;
        cursor: default;
      }
      .lc-header { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
      .lc-title-row { display: flex; align-items: center; gap: 10px; }
      .lc-icon { font-size: 20px; }
      .lc-title { font-size: 15px; font-weight: 600; color: var(--lc-accent); }

      .lc-body {}

      /* Readability */
      .body-para {
        font-size: 14.5px; color: var(--text); line-height: 1.85;
        max-width: 72ch; margin: 0 0 12px;
      }
      .body-para:last-child { margin-bottom: 0; }

      /* Keyword highlighting */
      .kw-pill {
        background: rgba(74,156,200,0.15); border: 1px solid rgba(74,156,200,0.3);
        color: #7eb8c9; border-radius: 4px; padding: 0 5px;
        font-style: normal; white-space: nowrap;
      }
      .kw-shelf { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }
      .kw-shelf-label {
        font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em;
        text-transform: uppercase; color: var(--muted); display: block; margin-bottom: 8px;
      }
      .kw-chips-row { display: flex; flex-wrap: wrap; gap: 6px; }
      .kw-badge {
        background: var(--surface2); border: 1px solid var(--border2);
        border-radius: 5px; padding: 3px 9px;
        font-size: 11px; color: #7eb8c9; font-family: var(--font-mono);
      }

      /* Example */
      .example-body {}
      .example-quote {
        background: rgba(90,171,114,0.07);
        border-left: 3px solid #5aab72;
        border-radius: 0 10px 10px 0; padding: 14px 18px;
      }

      /* Analogy */
      .analogy-body {}
      .analogy-think {
        font-size: 12px; color: #9b72c8; font-style: italic;
        font-family: var(--font-display); margin-bottom: 10px;
      }
      .analogy-text { color: var(--text); }

      /* Takeaways */
      .takeaways-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
      .takeaway-row { display: flex; gap: 12px; align-items: flex-start; }
      .takeaway-check { color: #c8a032; flex-shrink: 0; margin-top: 2px; font-size: 14px; }
      .takeaway-text { font-size: 14px; color: var(--text); line-height: 1.7; }

      /* Practice */
      .practice-body { display: flex; flex-direction: column; gap: 16px; }
      .practice-q { font-size: 16px; font-weight: 500; color: var(--text); line-height: 1.55; max-width: 64ch; }
      .practice-actions { display: flex; gap: 10px; flex-wrap: wrap; }
      .prac-btn {
        padding: 9px 18px; border-radius: 9px; font-size: 13px;
        font-family: var(--font-body); cursor: pointer; border: 1px solid;
        transition: opacity 0.15s;
      }
      .prac-btn:hover { opacity: 0.85; }
      .prac-btn.hint { background: transparent; border-color: var(--border2); color: var(--text2); }
      .prac-btn.reveal { background: var(--accent); border-color: var(--accent); color: #0a0a0c; }

      .practice-hint {
        background: rgba(200,160,50,0.08); border: 1px solid rgba(200,160,50,0.2);
        border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px;
      }
      .hint-label { font-family: var(--font-mono); font-size: 10px; color: #c8a032; letter-spacing: 0.08em; }
      .hint-text { font-size: 14px; color: var(--text2); line-height: 1.65; }

      .practice-answer {
        background: rgba(90,171,114,0.07); border: 1px solid rgba(90,171,114,0.2);
        border-radius: 10px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px;
        overflow: hidden;
      }
      .answer-label { font-family: var(--font-mono); font-size: 10px; color: #5aab72; letter-spacing: 0.08em; }
      .answer-text { font-size: 14px; color: var(--text); line-height: 1.7; }
      .eval-label { font-size: 12px; color: var(--text2); font-weight: 500; }
      .eval-btns { display: flex; gap: 10px; flex-wrap: wrap; }
      .eval-btn {
        padding: 9px 20px; border-radius: 9px; font-size: 13px;
        font-family: var(--font-body); cursor: pointer; border: 1px solid;
        transition: all 0.15s;
      }
      .eval-btn.understood { background: rgba(90,171,114,0.15); border-color: #5aab72; color: #5aab72; }
      .eval-btn.again { background: rgba(201,110,110,0.12); border-color: #c96e6e; color: #c96e6e; }
      .eval-done { font-size: 14px; color: var(--text2); padding: 8px 0; }

      /* Follow-up */
      .followup-grid { display: flex; flex-direction: column; gap: 8px; }
      .followup-card {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 16px; border-radius: 11px;
        background: var(--surface2); border: 1px solid var(--border);
        font-size: 13px; color: var(--text2); cursor: pointer; text-align: left;
        font-family: var(--font-body); width: 100%;
        transition: border-color 0.12s, color 0.12s;
      }
      .followup-arrow { color: #3abcc8; flex-shrink: 0; }
      .followup-text { line-height: 1.5; }

      /* Continue button */
      .continue-row { display: flex; justify-content: center; padding: 4px 0; }
      .continue-btn {
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        padding: 12px 32px; border-radius: 12px;
        background: var(--accent); color: #0a0a0c; border: none;
        font-size: 14px; font-weight: 500; font-family: var(--font-body);
        cursor: pointer;
      }
      .continue-next-label { font-size: 11px; opacity: 0.65; font-weight: 400; }
      .finish-btn {
        padding: 11px 28px; border-radius: 11px;
        background: transparent; border: 1px solid var(--accent);
        color: var(--accent); font-size: 14px; font-family: var(--font-body);
        cursor: pointer; transition: all 0.15s; align-self: center;
      }

      /* Quick Actions */
      .quick-actions { padding-top: 12px; border-top: 1px solid var(--border); }
      .qa-label {
        font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em;
        text-transform: uppercase; color: var(--muted); margin-bottom: 10px;
      }
      .qa-grid { display: flex; flex-wrap: wrap; gap: 7px; }
      .qa-btn {
        display: flex; align-items: center; gap: 6px;
        padding: 7px 13px; border-radius: 8px;
        background: var(--surface2); border: 1px solid var(--border);
        font-size: 12px; color: var(--text2); cursor: pointer;
        font-family: var(--font-body); transition: all 0.12s;
      }
      .qa-btn:hover { border-color: var(--accent); color: var(--text); }
      .qa-emoji { font-size: 13px; }
      .qa-label-text { white-space: nowrap; }

      /* Lesson Complete */
      .lesson-complete {
        background: var(--surface); border: 1px solid var(--border);
        border-radius: 18px; padding: 28px 32px;
        display: flex; flex-direction: column; align-items: center;
        text-align: center; gap: 14px;
      }
      .lc-confetti { font-size: 40px; }
      .lc-title { font-family: var(--font-display); font-size: 22px; letter-spacing: -0.01em; color: var(--text); margin: 0; }
      .lc-sub { font-size: 13px; color: var(--text2); margin: 0; }
      .lc-points { list-style: none; text-align: left; display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 380px; }
      .lc-point { display: flex; gap: 10px; font-size: 14px; color: var(--text); align-items: flex-start; }
      .lc-check { color: #5aab72; flex-shrink: 0; }
      .lc-stats { display: flex; gap: 32px; flex-wrap: wrap; justify-content: center; width: 100%; }
      .lc-stat { display: flex; flex-direction: column; gap: 5px; align-items: center; }
      .lc-stat-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
      .lc-stat-value { font-size: 14px; font-weight: 500; text-transform: capitalize; }
      .mastery-wrap { display: flex; align-items: center; gap: 8px; }
      .mastery-track { width: 120px; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
      .mastery-fill { height: 100%; background: linear-gradient(90deg, #5aab72, var(--accent)); border-radius: 3px; }
      .mastery-pct { font-family: var(--font-mono); font-size: 12px; color: var(--accent); }
      .lc-continue {
        padding: 12px 28px; border-radius: 11px;
        background: var(--accent); color: #0a0a0c; border: none;
        font-size: 14px; font-weight: 500; font-family: var(--font-body); cursor: pointer;
      }

      /* Generating */
      .tutor-generating { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 13px; }
      .gen-dots { display: flex; gap: 4px; }
      .gen-dots span { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: blink 1.2s infinite; }
      .gen-dots span:nth-child(2) { animation-delay: 0.2s; }
      .gen-dots span:nth-child(3) { animation-delay: 0.4s; }
      .gen-text { font-size: 13px; color: var(--muted); }
      @keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }

      /* Input */
      .tutor-input-row {
        display: flex; gap: 8px; padding-top: 12px;
        border-top: 1px solid var(--border); margin-top: 4px; flex-shrink: 0;
      }
      .tutor-input {
        flex: 1; background: var(--surface2); border: 1px solid var(--border);
        border-radius: 12px; padding: 12px 16px; font-size: 14px;
        color: var(--text); font-family: var(--font-body); outline: none;
        transition: border-color 0.15s;
      }
      .tutor-input:focus { border-color: var(--accent); }
      .tutor-input::placeholder { color: var(--muted); }
      .tutor-send {
        padding: 12px 20px; background: var(--accent); border: none;
        border-radius: 12px; color: #0a0a0c; font-size: 16px;
        cursor: pointer; flex-shrink: 0;
      }
      .tutor-send:disabled { opacity: 0.4; cursor: not-allowed; }
      .spin { animation: spin 0.9s linear infinite; display: inline-block; }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* Responsive */
      @media (max-width: 640px) {
        .lesson-card { padding: 14px 16px; }
        .lh-meta { gap: 6px; }
        .qa-grid { gap: 5px; }
        .qa-label-text { display: none; }
        .user-bubble { max-width: 92%; padding: 10px 14px; }
        .lc-stats { gap: 20px; }
        .practice-q { font-size: 14px; }
        .body-para { font-size: 14px; line-height: 1.75; }
        .diff-pills { flex-wrap: wrap; gap: 4px; }
        .diff-pill { padding: 5px 10px; font-size: 11px; }
      }
    `}</style>
  );
}