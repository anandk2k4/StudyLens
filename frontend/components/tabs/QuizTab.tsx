// components/tabs/QuizTab.tsx
"use client";

import { useState } from "react";
import { QuizItem } from "@/lib/store";

export function QuizTab({ quiz }: { quiz: any }) {
  // Cast from Prisma JsonValue to QuizItem[]
  const items = (quiz as QuizItem[]) ?? [];

  const [selected, setSelected] = useState<Record<number, string>>({});

  const score    = Object.entries(selected).filter(([i, v]) => v === items[+i]?.answer).length;
  const answered = Object.keys(selected).length;

  if (!items.length) {
    return <div className="tab-content"><p style={{ color: "var(--muted)" }}>No quiz available.</p></div>;
  }

  return (
    <div className="tab-content">
      {answered === items.length && answered > 0 && (
        <div className="quiz-score">
          Score: {score} / {items.length}
          {score === items.length && <span className="score-perfect"> 🎉 Perfect!</span>}
        </div>
      )}
      <div className="quiz-list">
        {items.map((item, qi) => (
          <div key={qi} className="quiz-card">
            <p className="quiz-question">
              <span className="quiz-num">Q{qi + 1}</span>
              {item.question}
            </p>
            <div className="quiz-options">
              {item.options.map((opt, oi) => {
                const isSelected = selected[qi] === opt;
                const isCorrect  = opt === item.answer;
                const isAnswered = selected[qi] !== undefined;
                let state = "";
                if (isAnswered && isSelected && isCorrect)  state = "correct";
                if (isAnswered && isSelected && !isCorrect) state = "wrong";
                if (isAnswered && !isSelected && isCorrect) state = "reveal";
                return (
                  <button
                    key={oi}
                    className={`quiz-option ${state}`}
                    onClick={() =>
                      !selected[qi] && setSelected((s) => ({ ...s, [qi]: opt }))
                    }
                  >
                    <span className="option-lbl">{["A","B","C","D"][oi]}</span>
                    <span>{opt}</span>
                    {isAnswered && isCorrect  && <span className="badge-ok">✓</span>}
                    {isAnswered && isSelected && !isCorrect && <span className="badge-x">✗</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}