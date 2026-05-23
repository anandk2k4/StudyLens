"use client";

import { useState } from "react";
import { QuizItem } from "@/types";

export function QuizTab({ quiz }: { quiz: QuizItem[] }) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const score = Object.entries(selected).filter(
    ([i, v]) => v === quiz[+i]?.answer
  ).length;
  const answered = Object.keys(selected).length;

  return (
    <div className="tab-content">
      {answered === quiz.length && answered > 0 && (
        <div className="quiz-score">
          Score: {score} / {quiz.length}
          <span className={score === quiz.length ? "score-perfect" : ""}>
            {score === quiz.length ? " 🎉 Perfect!" : ""}
          </span>
        </div>
      )}
      <div className="quiz-list">
        {quiz.map((item, qi) => (
          <div key={qi} className="quiz-card">
            <p className="quiz-question">
              <span className="quiz-num">Q{qi + 1}</span>
              {item.question}
            </p>
            <div className="quiz-options">
              {item.options.map((opt, oi) => {
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
                      !selected[qi] &&
                      setSelected((s) => ({ ...s, [qi]: opt }))
                    }
                  >
                    <span className="option-lbl">{["A","B","C","D"][oi]}</span>
                    <span>{opt}</span>
                    {answered && isCorrect && <span className="badge-ok">✓</span>}
                    {answered && isSelected && !isCorrect && <span className="badge-x">✗</span>}
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