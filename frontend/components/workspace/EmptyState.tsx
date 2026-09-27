"use client";

import { motion } from "framer-motion";
import {
  FileText,
  StickyNote,
  Brain,
  Layers,
  GraduationCap,
  Sparkles,
  BookMarked,
  Search,
  Video,
} from "lucide-react";

export function EmptyState() {
  const tools = [
    { icon: FileText, title: "AI Summary", sub: "Key takeaways" },
    { icon: StickyNote, title: "Smart Notes", sub: "Structured notes" },
    { icon: Brain, title: "Quiz Mode", sub: "Interactive MCQs" },
    { icon: Layers, title: "Flashcards", sub: "Active recall" },
    { icon: GraduationCap, title: "AI Tutor", sub: "Adaptive teaching" },
    { icon: Sparkles, title: "AI Revision", sub: "Exam preparation" },
    { icon: BookMarked, title: "Chapters", sub: "Timeline marks" },
    { icon: Search, title: "Semantic Search", sub: "Concept discovery" },
  ];

  return (
    <div className="empty-state">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#00D9C0]/20 to-[#00B09D]/20 border border-[#00D9C0]/30 text-[#33E3D0] shadow-2xl shadow-[#00D9C0]/15"
      >
        <Video className="h-10 w-10 text-[#00D9C0]" />
      </motion.div>

      <motion.h2
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="empty-title"
      >
        Select or Upload a Lecture
      </motion.h2>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="empty-sub"
      >
        Choose an existing study session from the sidebar or drop a new video / YouTube URL to construct its Knowledge Base.
      </motion.p>

      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="empty-features"
      >
        {tools.map((t, idx) => {
          const Icon = t.icon;
          return (
            <div key={t.title} className="empty-feature">
              <Icon className="h-5 w-5 text-[#00D9C0]" />
              <span className="ef-title">{t.title}</span>
              <span className="ef-sub">{t.sub}</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
