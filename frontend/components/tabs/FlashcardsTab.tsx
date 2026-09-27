"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Flashcard } from "@/lib/store";

export function FlashcardsTab({ flashcards: raw }: { flashcards: any }) {
  const cards = (raw as Flashcard[]) ?? [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  if (!cards.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-[#4A5B62]">
        <Layers className="mb-2 h-8 w-8 text-[#4A5B62]/40" />
        <p className="font-semibold text-[#8B9A9D]">No flashcards available</p>
        <p className="text-xs text-[#4A5B62]">
          Flashcards are generated automatically when a video is processed.
        </p>
      </div>
    );
  }

  const card = cards[index];
  const total = cards.length;
  const progressPercent = Math.round(((index + 1) / total) * 100);

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

  if (done) {
    return (
      <div className="flex max-w-xl mx-auto flex-col items-center justify-center py-16 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#10b981]/15 text-[#10b981]"
        >
          <CheckCircle2 className="h-8 w-8" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white">Review Complete!</h2>
        <p className="mt-2 text-sm text-[#8B9A9D]">
          You have reviewed all {total} flashcards for this lecture.
        </p>
        <button
          onClick={handleRestart}
          className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00D9C0] to-[#00B09D] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00D9C0]/20 hover:opacity-95"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Review Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      {/* Header & Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono text-[#8B9A9D]">
          <span className="flex items-center gap-1.5 font-bold text-[#00D9C0]">
            <Layers className="h-4 w-4" />
            <span>Card {index + 1} of {total}</span>
          </span>
          <span className="text-[#4A5B62]">
            {flipped ? "Showing Answer" : "Click card to flip"}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#111A1F]">
          <div
            className="h-full bg-gradient-to-r from-[#00D9C0] to-[#00B09D] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3D Flip Card */}
      <div
        className="relative h-64 w-full cursor-pointer select-none [perspective:1000px]"
        onClick={handleFlip}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="relative h-full w-full [transform-style:preserve-3d]"
        >
          {/* Front Face */}
          <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-[#1A2830] bg-[#0D1519] p-8 shadow-xl [backface-visibility:hidden]">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#33E3D0]">
              Question
            </span>
            <p className="my-auto text-lg font-medium leading-relaxed text-white">
              {card.front}
            </p>
            <span className="text-right text-[11px] font-mono text-[#4A5B62]">
              Tap to see answer ↵
            </span>
          </div>

          {/* Back Face */}
          <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-[#00D9C0]/40 bg-gradient-to-b from-[#111A1F] to-[#0D1519] p-8 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#00D9C0]">
              Answer
            </span>
            <p className="my-auto text-lg font-medium leading-relaxed text-[#F5F7F7]">
              {card.back}
            </p>
            <span className="text-right text-[11px] font-mono text-[#4A5B62]">
              Tap to see question ↵
            </span>
          </div>
        </motion.div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={index === 0}
          className="flex items-center gap-1.5 rounded-xl border border-[#1A2830] bg-[#0D1519] px-4 py-2.5 text-sm font-medium text-[#8B9A9D] transition-colors hover:border-[#00D9C0] hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={handleFlip}
          className="rounded-xl border border-[#00D9C0]/40 bg-[#00D9C0]/10 px-5 py-2.5 text-sm font-semibold text-[#33E3D0] transition-colors hover:bg-[#00D9C0] hover:text-white"
        >
          {flipped ? "Show Question" : "Reveal Answer"}
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00D9C0] to-[#00B09D] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#00D9C0]/20 hover:opacity-95"
        >
          <span>{index === total - 1 ? "Finish" : "Next"}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex flex-wrap justify-center gap-1.5 pt-2">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setIndex(i);
              setFlipped(false);
            }}
            className={`h-2 rounded-full transition-all ${
              i === index
                ? "w-6 bg-[#00D9C0]"
                : i < index
                ? "w-2 bg-[#00D9C0]/40"
                : "w-2 bg-[#1A2830]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}