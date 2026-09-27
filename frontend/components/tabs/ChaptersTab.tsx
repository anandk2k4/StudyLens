"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookMarked, Play, Clock } from "lucide-react";
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
  chapters: any;
  currentTime?: number;
  onSeek: (t: number) => void;
}) {
  const chapters = (raw as Chapter[]) ?? [];
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!chapters.length) return;
    const idx = chapters.findLastIndex((c) => currentTime >= c.start);
    if (idx !== -1 && idx !== activeIdx) setActiveIdx(idx);
  }, [currentTime, chapters]);

  if (!chapters.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-[#4A5B62]">
        <BookMarked className="mb-2 h-8 w-8 text-[#4A5B62]/40" />
        <p className="font-semibold text-[#8B9A9D]">No chapters detected</p>
        <p className="text-xs text-[#4A5B62]">
          Chapters are extracted automatically from the Knowledge Base for structured lectures.
        </p>
      </div>
    );
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#1A2830] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D9C0]/10 text-[#00D9C0]">
            <BookMarked className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Lecture Chapters</h2>
            <p className="text-xs text-[#8B9A9D]">
              Semantic topic boundaries with instant timeline navigation
            </p>
          </div>
        </div>

        <span className="font-mono text-xs font-semibold text-[#4A5B62]">
          {chapters.length} chapters
        </span>
      </div>

      {/* Chapters list */}
      <div className="space-y-3">
        {chapters.map((chapter, idx) => {
          const isActive = idx === activeIdx;
          const duration = chapter.end - chapter.start;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => {
                setActiveIdx(idx);
                onSeek(chapter.start);
              }}
              className={`group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
                isActive
                  ? "border-[#00D9C0] bg-[#111A1F] shadow-md shadow-[#00D9C0]/10"
                  : "border-[#1A2830] bg-[#0D1519] hover:border-[#00D9C0]/40 hover:bg-[#111A1F]"
              }`}
            >
              {/* Number and Timestamp */}
              <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg font-mono text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-[#00D9C0] text-white"
                      : "bg-[#111A1F] text-[#8B9A9D] group-hover:text-white"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="font-mono text-[11px] font-semibold text-[#00D9C0]">
                  {fmt(chapter.start)}
                </span>
              </div>

              {/* Title & Summary */}
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-sm font-semibold transition-colors ${
                    isActive ? "text-[#33E3D0]" : "text-white group-hover:text-[#33E3D0]"
                  }`}
                >
                  {chapter.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#8B9A9D]">
                  {chapter.summary}
                </p>
              </div>

              {/* Duration and Play Indicator */}
              <div className="flex flex-col items-end gap-2 shrink-0 text-xs font-mono text-[#4A5B62]">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{fmt(duration)}</span>
                </div>
                {isActive && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[#10b981]">
                    <Play className="h-3 w-3 fill-[#10b981]" />
                    <span>Now Playing</span>
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}