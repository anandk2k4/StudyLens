"use client";

import { motion } from "framer-motion";
import { Loader2, Database, Brain, Sparkles, CheckCircle2 } from "lucide-react";
import { getStatusLabel } from "@/hooks/usePolling";

const STAGES = [
  { key: "DOWNLOADING", label: "Downloading video", icon: Loader2 },
  { key: "EXTRACTING_AUDIO", label: "Extracting audio track", icon: Loader2 },
  { key: "TRANSCRIBING", label: "Transcribing speech", icon: Loader2 },
  { key: "BUILDING_KNOWLEDGE_BASE", label: "Constructing Knowledge Base", icon: Database },
  { key: "GENERATING_EMBEDDINGS", label: "Indexing search vectors", icon: Brain },
  { key: "GENERATING_FEATURES", label: "Generating study materials", icon: Sparkles },
  { key: "READY", label: "Knowledge Base ready", icon: CheckCircle2 },
];

function getProgress(status: string): number {
  const index = STAGES.findIndex((s) => s.key === status);
  if (index === -1) return 10;
  return Math.round(((index + 1) / STAGES.length) * 100);
}

export function ProcessingIndicator({ status }: { status: string }) {
  const label = getStatusLabel(status);
  const progress = getProgress(status);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#00D9C0]/30 bg-[#0D1519] shadow-2xl shadow-[#00D9C0]/10"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#00D9C0]/15 to-[#00B09D]/15 blur-lg" />
        <Loader2 className="relative h-10 w-10 animate-spin text-[#00D9C0]" />
      </motion.div>

      <motion.h2
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-sans text-2xl font-bold tracking-tight text-white md:text-3xl"
      >
        Building Knowledge Base
      </motion.h2>

      <motion.p
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-2 font-mono text-sm font-semibold tracking-wide text-[#00D9C0]"
      >
        {label}
      </motion.p>

      {/* Progress Bar */}
      <div className="mt-6 h-2 w-72 overflow-hidden rounded-full bg-[#111A1F] p-0.5 md:w-96">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#00D9C0] to-[#00B09D]"
          initial={{ width: "10%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      <p className="mt-2 text-xs font-mono text-[#4A5B62]">{progress}% completed</p>

      {/* Reassurance text */}
      <p className="mt-8 max-w-sm text-xs leading-relaxed text-[#8B9A9D]">
        You can safely leave or refresh this page. Your lecture is being processed in the background and will be ready when you return.
      </p>
    </div>
  );
}