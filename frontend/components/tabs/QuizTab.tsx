"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import { QuizItem } from "@/lib/store";

export function QuizTab({ quiz }: { quiz: any }) {
  const items = (quiz as QuizItem[]) ?? [];
  const [selected, setSelected] = useState<Record<number, string>>({});

  const score = Object.entries(selected).filter(
    ([i, v]) => v === items[+i]?.answer
  ).length;
  const answered = Object.keys(selected).length;
  const isComplete = answered === items.length && items.length > 0;

  if (!items.length) {
    return (
      <div className="py-12 text-center text-sm text-[#4A5B62]">
        No quiz questions generated for this lecture.
      </div>
    );
  }

  function handleReset() {
    setSelected({});
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A2830] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D9C0]/10 text-[#33E3D0]">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Interactive Knowledge Quiz</h2>
            <p className="text-xs text-[#8B9A9D]">
              Test your retention of core lecture concepts
            </p>
          </div>
        </div>

        {answered > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-[#1A2830] bg-[#0D1519] px-3 py-1.5 text-xs font-medium text-[#8B9A9D] transition-colors hover:border-[#00D9C0] hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Quiz</span>
          </button>
        )}
      </div>

      {/* Completion Score Banner */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-between rounded-2xl border border-[#10b981]/30 bg-[#10b981]/10 p-5 shadow-lg shadow-[#10b981]/5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/20 text-[#10b981]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Quiz Complete! Score: {score} / {items.length}
              </p>
              <p className="text-xs text-[#10b981]">
                {score === items.length
                  ? "Outstanding! You mastered all tested concepts."
                  : `Good effort! You got ${Math.round((score / items.length) * 100)}% correct.`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {items.map((item, qi) => (
          <motion.div
            key={qi}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qi * 0.05 }}
            className="rounded-2xl border border-[#1A2830] bg-[#0D1519] p-6 shadow-md"
          >
            <div className="mb-4 flex items-baseline gap-3">
              <span className="rounded-md border border-[#00D9C0]/30 bg-[#00D9C0]/10 px-2.5 py-0.5 font-mono text-xs font-bold text-[#33E3D0]">
                Q{qi + 1}
              </span>
              <h3 className="text-base font-semibold leading-snug text-white">
                {item.question}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {item.options.map((opt, oi) => {
                const isSelected = selected[qi] === opt;
                const isCorrect = opt === item.answer;
                const isAnswered = selected[qi] !== undefined;

                let stateClasses = "border-[#1A2830] bg-[#111A1F] hover:border-[#00D9C0]/50 text-[#F5F7F7]";

                if (isAnswered) {
                  if (isSelected && isCorrect) {
                    stateClasses = "border-[#10b981] bg-[#10b981]/15 text-white";
                  } else if (isSelected && !isCorrect) {
                    stateClasses = "border-[#ef4444] bg-[#ef4444]/15 text-white";
                  } else if (isCorrect) {
                    stateClasses = "border-[#10b981]/60 bg-[#10b981]/10 text-white";
                  }
                }

                return (
                  <button
                    key={oi}
                    disabled={isAnswered}
                    onClick={() =>
                      !selected[qi] && setSelected((s) => ({ ...s, [qi]: opt }))
                    }
                    className={`flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${stateClasses}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0D1519] font-mono text-xs text-[#8B9A9D]">
                      {["A", "B", "C", "D"][oi]}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10b981]" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="h-4 w-4 shrink-0 text-[#ef4444]" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}