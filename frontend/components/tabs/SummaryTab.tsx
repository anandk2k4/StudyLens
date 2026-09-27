"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Clock, Sparkles } from "lucide-react";

function applyInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong class='text-white font-semibold'>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em class='text-[#33E3D0]'>$1</em>");
}

function parseSummary(raw: string): { overview: string; points: string[] } {
  let text = raw.trim();

  if (!text.includes("\n- ") && !text.includes("\n-")) {
    if (text.includes("* ") || /conclusion\s*:/i.test(text)) {
      const withBreaks = text
        .replace(/\s*\*\s+/g, "\n- ")
        .replace(/\s*(?:conclusion|in conclusion|to conclude)\s*:\s*/gi, "\n- ")
        .replace(/\s*(?:key points?|main points?|key takeaways?)\s*:\s*/gi, "\n");
      text = withBreaks;
    }
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const overviewLines: string[] = [];
  const points: string[] = [];

  lines.forEach((line) => {
    if (/^-\s+/.test(line)) {
      points.push(line.replace(/^-\s+/, ""));
    } else if (points.length === 0) {
      overviewLines.push(line);
    } else {
      points.push(line);
    }
  });

  return { overview: overviewLines.join(" "), points };
}

function estimateReadTime(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

export function SummaryTab({ summary }: { summary: string }) {
  const { overview, points } = useMemo(() => parseSummary(summary), [summary]);
  const readTime = useMemo(() => estimateReadTime(summary), [summary]);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      {/* Header bar */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A2830] pb-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D9C0]/10 text-[#33E3D0]">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">AI Summary</h2>
            <p className="text-xs text-[#8B9A9D]">
              Distilled from structured lecture knowledge
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-md border border-[#1A2830] bg-[#0D1519] px-2.5 py-1 font-mono text-xs text-[#8B9A9D]">
          <Clock className="h-3.5 w-3.5 text-[#00D9C0]" />
          <span>~{readTime} min read</span>
        </div>
      </motion.div>

      {/* Overview Paragraph */}
      {overview && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-base leading-relaxed text-[#F5F7F7]"
          dangerouslySetInnerHTML={{ __html: applyInline(overview) }}
        />
      )}

      {/* Bulleted Key Takeaways Card */}
      {points.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[#1A2830] bg-[#0D1519] p-6 shadow-xl shadow-black/40"
        >
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#00D9C0]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Key Takeaways</span>
          </div>

          <div className="space-y-3.5">
            {points.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                className="flex items-start gap-3.5 text-sm leading-relaxed text-[#F5F7F7]"
              >
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00D9C0] shadow-sm shadow-[#00D9C0]" />
                <span dangerouslySetInnerHTML={{ __html: applyInline(p) }} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}