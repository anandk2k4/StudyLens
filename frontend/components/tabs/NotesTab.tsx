"use client";

import { motion } from "framer-motion";
import { StickyNote, Check } from "lucide-react";

export function NotesTab({ notes }: { notes: string }) {
  const lines = notes
    .split("\n")
    .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#1A2830] pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D9C0]/10 text-[#00D9C0]">
          <StickyNote className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Smart Study Notes</h2>
          <p className="text-xs text-[#8B9A9D]">
            Key concepts and takeaways organized for fast review
          </p>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-2.5">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            className="group flex items-start gap-3.5 rounded-xl border border-[#1A2830] bg-[#0D1519] p-4 text-sm leading-relaxed text-[#F5F7F7] transition-colors hover:border-[#00D9C0]/40 hover:bg-[#111A1F]"
          >
            <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#00D9C0]/15 text-[#33E3D0] transition-colors group-hover:bg-[#00D9C0] group-hover:text-white">
              <Check className="h-2.5 w-2.5" />
            </div>
            <span className="flex-1">{line}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
