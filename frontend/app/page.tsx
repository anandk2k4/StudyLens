"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FileText,
  StickyNote,
  Brain,
  Layers,
  GraduationCap,
  Sparkles,
  BookMarked,
  MessageSquare,
  Search,
  FileCode,
  ArrowRight,
  Play,
  Upload,
  Zap,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

/* ── Data ─────────────────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: FileText, title: "AI Summary", desc: "Concise executive summaries distilled from the structured knowledge base." },
  { icon: StickyNote, title: "Smart Notes", desc: "Hierarchical, scannable study notes organized by topics and key definitions." },
  { icon: Brain, title: "Knowledge Quiz", desc: "Interactive multiple-choice questions targeting learning objectives and recall." },
  { icon: Layers, title: "Flashcards", desc: "Active recall flashcards covering key definitions, relationships, and facts." },
  { icon: GraduationCap, title: "AI Tutor", desc: "An adaptive teacher explaining concepts with custom analogies and examples." },
  { icon: Sparkles, title: "AI Revision", desc: "Multiple revision modes that adapt to your understanding and reinforce weak areas." },
  { icon: BookMarked, title: "Chapter Detection", desc: "Automatic topic segmentation with timestamp navigation for focused study." },
  { icon: MessageSquare, title: "Ask AI", desc: "Ask anything about your lecture content and receive context-grounded answers." },
  { icon: Search, title: "Semantic Search", desc: "Search by concepts and meaning rather than exact word matches." },
  { icon: FileCode, title: "Full Transcript", desc: "Complete searchable transcript with timestamp navigation and highlights." },
];

const STEPS = [
  { n: "01", title: "Upload or paste", desc: "Drop a video file or paste a YouTube URL. StudyLens handles everything automatically.", icon: Upload },
  { n: "02", title: "AI transcribes", desc: "Advanced speech recognition transcribes your lecture into searchable, structured text.", icon: FileCode },
  { n: "03", title: "AI processes", desc: "Our engine extracts concepts, generates summaries, notes, quizzes, and flashcards.", icon: Zap },
  { n: "04", title: "Study & learn", desc: "Review materials, test yourself, interact with the AI Tutor, and revise effectively.", icon: CheckCircle2 },
];

const HERO_CHIPS = [
  { icon: FileText, label: "AI Summary" },
  { icon: StickyNote, label: "Smart Notes" },
  { icon: Brain, label: "Quizzes", accent: true },
  { icon: Layers, label: "Flashcards" },
  { icon: GraduationCap, label: "AI Tutor" },
];

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#05090B] text-[#F5F7F7] selection:bg-[#00D9C0]/30 selection:text-white" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ───────── NAVBAR ───────── */}
      <nav className="sticky top-0 z-50 border-b border-[#1A2830] bg-[#05090B]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image src="/studylens-brand-logo.png" alt="StudyLens" width={130} height={32} className="h-7 w-auto sm:h-8" priority />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-7 text-[13px] font-medium text-[#8B9A9D] md:flex">
            <Link href="#features" className="transition-colors hover:text-white">Features</Link>
            <Link href="#how-it-works" className="transition-colors hover:text-white">How it works</Link>
            <Link href="#" className="transition-colors hover:text-white">Pricing</Link>
            <Link href="#" className="transition-colors hover:text-white">FAQ</Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-[13px] font-medium text-[#8B9A9D] transition-colors hover:text-white sm:block">Log in</Link>
            <Link href="/register" className="rounded-lg bg-[#00D9C0] px-4 py-2 text-[13px] font-semibold text-[#05090B] transition-all hover:bg-[#00C4AD] active:scale-[0.97]">
              Get started free
            </Link>
            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-[#8B9A9D] hover:bg-[#111A1F] md:hidden">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-[#1A2830] bg-[#0A1014] px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-sm font-medium text-[#8B9A9D]">
              <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">Features</Link>
              <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">How it works</Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">Log in</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-[#00D9C0]/[0.04] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-20 md:pb-28 md:pt-28 lg:pb-32 lg:pt-32">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">

            {/* Left: Copy */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-1 max-w-xl lg:max-w-lg xl:max-w-xl">
              {/* Badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00D9C0]/25 bg-[#00D9C0]/[0.08] px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-[#00D9C0] uppercase">
                <Sparkles className="h-3 w-3" />
                AI-Powered Lecture Intelligence
              </div>

              <h1 className="text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem]">
                Turn your lectures into{" "}
                <span className="text-[#00D9C0]">knowledge you can&nbsp;use.</span>
              </h1>

              <p className="mt-5 text-base leading-relaxed text-[#8B9A9D] sm:text-lg sm:leading-relaxed lg:text-base lg:leading-relaxed xl:text-lg">
                Upload any video or paste a YouTube link. StudyLens transcribes, understands, and builds a complete knowledge base — giving you summaries, notes, quizzes, flashcards and an AI tutor, all from your content.
              </p>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#00D9C0] px-6 py-3 text-sm font-semibold text-[#05090B] transition-all hover:bg-[#00C4AD] hover:shadow-lg hover:shadow-[#00D9C0]/20 active:scale-[0.97]">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button className="inline-flex items-center gap-2 rounded-xl border border-[#1A2830] bg-[#0D1519] px-6 py-3 text-sm font-medium text-white transition-colors hover:border-[#243540] hover:bg-[#111A1F]">
                  <Play className="h-4 w-4 text-[#FF3347]" />
                  Watch demo
                </button>
              </div>

              {/* Feature chips */}
              <div className="mt-8 flex flex-wrap items-center gap-2.5">
                {HERO_CHIPS.map((chip) => {
                  const ChipIcon = chip.icon;
                  return (
                    <div key={chip.label} className="flex items-center gap-1.5 rounded-full border border-[#1A2830] bg-[#0D1519]/80 px-3 py-1.5 text-[11px] font-medium text-[#8B9A9D]">
                      <ChipIcon className={`h-3 w-3 ${chip.accent ? "text-[#FF3347]" : "text-[#00D9C0]"}`} />
                      {chip.label}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right: Dashboard preview */}
            <motion.div initial={{ opacity: 0, x: 30, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }} className="w-full flex-1 lg:max-w-[520px] xl:max-w-[580px]">
              <div className="relative rounded-2xl border border-[#1A2830] bg-[#071114] p-1.5 shadow-2xl shadow-black/60">
                {/* Top accent line */}
                <div className="absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-[#00D9C0]/30 to-transparent" />

                <div className="overflow-hidden rounded-xl border border-[#1A2830]/60 bg-[#0A1014]">
                  {/* Mock browser chrome */}
                  <div className="flex items-center gap-1.5 border-b border-[#1A2830] px-4 py-2.5">
                    <div className="h-2 w-2 rounded-full bg-[#FF3347]/60" />
                    <div className="h-2 w-2 rounded-full bg-[#f59e0b]/40" />
                    <div className="h-2 w-2 rounded-full bg-[#10b981]/40" />
                    <div className="ml-3 h-4 flex-1 rounded bg-[#111A1F] max-w-[160px]" />
                  </div>

                  {/* Mock dashboard content */}
                  <div className="flex min-h-[280px] sm:min-h-[320px]">
                    {/* Mini sidebar */}
                    <div className="hidden w-[52px] shrink-0 border-r border-[#1A2830] bg-[#0A1014] p-2.5 sm:flex sm:flex-col sm:gap-3 sm:pt-4">
                      <div className="mx-auto h-5 w-5 rounded bg-[#00D9C0]/20" />
                      <div className="mx-auto mt-3 h-3 w-3 rounded-sm bg-[#1A2830]" />
                      <div className="mx-auto h-3 w-3 rounded-sm bg-[#1A2830]" />
                      <div className="mx-auto h-3 w-3 rounded-sm bg-[#1A2830]" />
                      <div className="mx-auto h-3 w-3 rounded-sm bg-[#00D9C0]/30" />
                    </div>

                    {/* Main content area */}
                    <div className="flex-1 p-4 sm:p-5">
                      {/* Header row */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="h-3.5 w-32 rounded bg-[#1A2830]" />
                        <div className="flex gap-2">
                          <div className="h-5 w-12 rounded bg-[#1A2830]" />
                          <div className="h-5 w-16 rounded bg-[#00D9C0]/20" />
                        </div>
                      </div>

                      {/* Content cards */}
                      <div className="flex gap-4">
                        <div className="flex-[2] space-y-3">
                          {/* Upload card */}
                          <div className="rounded-lg border border-[#1A2830] bg-[#111A1F] p-3.5">
                            <div className="mb-2 h-2.5 w-3/4 rounded bg-[#1A2830]" />
                            <div className="mb-2 h-2 w-full rounded bg-[#1A2830]/50" />
                            <div className="flex gap-2">
                              <div className="h-5 w-20 rounded bg-[#FF3347]/30" />
                              <div className="h-5 w-24 rounded bg-[#1A2830]" />
                            </div>
                          </div>
                          {/* Lecture card */}
                          <div className="rounded-lg border border-[#1A2830] bg-[#111A1F] p-3.5">
                            <div className="mb-2 h-2 w-1/3 rounded bg-[#1A2830]" />
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-16 rounded bg-[#0D1519] border border-[#1A2830]" />
                              <div className="flex-1 space-y-1.5">
                                <div className="h-2 w-3/4 rounded bg-[#1A2830]" />
                                <div className="h-1.5 w-full rounded-full bg-[#0D1519]">
                                  <div className="h-1.5 w-[65%] rounded-full bg-[#00D9C0]/60" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Side panels */}
                        <div className="hidden flex-1 flex-col gap-3 sm:flex">
                          <div className="flex-1 rounded-lg border border-[#1A2830] bg-[#111A1F] p-3 flex flex-col items-center justify-center">
                            <Brain className="h-6 w-6 text-[#00D9C0]/40 mb-1" />
                            <div className="h-1.5 w-8 rounded bg-[#1A2830]" />
                          </div>
                          <div className="flex-1 rounded-lg border border-[#1A2830] bg-[#111A1F] p-3 flex flex-col items-center justify-center">
                            <Layers className="h-6 w-6 text-[#FF3347]/40 mb-1" />
                            <div className="h-1.5 w-8 rounded bg-[#1A2830]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────── FEATURES GRID ───────── */}
      <section id="features" className="border-t border-[#1A2830] bg-[#071114]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Everything you need to master any subject
            </h2>
            <p className="mt-4 text-sm text-[#8B9A9D] sm:text-base leading-relaxed">
              Our intelligent engine processes your lectures to generate a complete toolkit for study and revision.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.04, duration: 0.35 }}
                  className="group rounded-xl border border-[#1A2830] bg-[#0D1519] p-5 transition-all hover:border-[#00D9C0]/40 hover:bg-[#111A1F]"
                >
                  <div className="mb-3.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#05090B] border border-[#1A2830] text-[#00D9C0] transition-colors group-hover:bg-[#00D9C0]/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">{f.title}</h3>
                  <p className="text-xs leading-relaxed text-[#8B9A9D]">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section id="how-it-works" className="border-t border-[#1A2830]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="mb-16 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              How StudyLens works
            </h2>
            <p className="mt-4 text-sm text-[#8B9A9D] sm:text-base">
              From long video to interactive study session in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="relative group">
                  {/* Connector line (desktop) */}
                  {idx < STEPS.length - 1 && (
                    <div className="pointer-events-none absolute left-[55%] right-[-45%] top-10 hidden h-px bg-gradient-to-r from-[#1A2830] to-transparent lg:block" />
                  )}
                  <div className="relative z-10 h-full rounded-2xl border border-[#1A2830] bg-[#0D1519] p-6 transition-all hover:-translate-y-1 hover:border-[#00D9C0]/30 hover:bg-[#111A1F]">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#05090B] border border-[#1A2830] text-[#00D9C0]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-3xl font-black text-[#1A2830]/60 group-hover:text-[#1A2830] transition-colors">{s.n}</span>
                    </div>
                    <h3 className="mb-2 text-base font-bold text-white">{s.title}</h3>
                    <p className="text-xs leading-relaxed text-[#8B9A9D]">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── FINAL CTA ───────── */}
      <section className="border-t border-[#1A2830] bg-[#071114]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#1A2830] bg-[#0D1519] shadow-2xl">
            {/* Glow effects */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#00D9C0]/10 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[#FF3347]/[0.07] blur-[80px]" />

            <div className="relative z-10 px-6 py-16 text-center sm:px-12 sm:py-20 md:px-16">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Ready to upgrade your study workflow?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-[#8B9A9D] sm:text-base leading-relaxed">
                Join students and professionals who learn faster and retain more with AI-powered lecture intelligence.
              </p>
              <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#00D9C0] px-7 py-3.5 text-sm font-semibold text-[#05090B] transition-all hover:bg-[#00C4AD] hover:shadow-lg hover:shadow-[#00D9C0]/20 active:scale-[0.97] sm:text-base">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer className="border-t border-[#1A2830]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <Image src="/studylens-brand-logo.png" alt="StudyLens" width={100} height={24} className="h-5 w-auto opacity-40 grayscale" />
          <p className="text-xs text-[#4A5B62]">© {new Date().getFullYear()} StudyLens AI. All rights reserved.</p>
          <div className="flex gap-5 text-xs text-[#4A5B62]">
            <Link href="#" className="transition-colors hover:text-white">Privacy</Link>
            <Link href="#" className="transition-colors hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}