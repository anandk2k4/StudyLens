// lib/store.ts — add Chapter type + chapters to SessionFull + "chapters" to ActiveTab

import { create } from "zustand";

export interface Segment {
  text:  string;
  start: number;
  end:   number;
}

export interface QuizItem {
  question: string;
  options:  string[];
  answer:   string;
}

export interface Flashcard {
  front: string;
  back:  string;
}

// ── NEW ───────────────────────────────────────────────────────────────────────
export interface Chapter {
  title:   string;
  start:   number;
  end:     number;
  summary: string;
}

export type SessionStatus =
  | "PROCESSING" | "DOWNLOADING" | "EXTRACTING_AUDIO" | "TRANSCRIBING"
  | "GENERATING_EMBEDDINGS" | "GENERATING_SUMMARY" | "GENERATING_NOTES"
  | "GENERATING_QUIZ" | "GENERATING_FLASHCARDS" | "READY" | "ERROR";

export type ActiveTab =
  | "summary" | "notes" | "quiz" | "transcript"
  | "chat" | "flashcards" | "chapters" | "tutor" | "revision";     // ← NEW

export interface SessionMeta {
  id:            string;
  title:         string;
  source:        "UPLOAD" | "YOUTUBE";
  status:        SessionStatus;
  videoUrl?:     string | null;
  videoId?:      string | null;
  duration?:     number | null;
  thumbnail?:    string | null;
  errorMessage?: string | null;
  createdAt:     Date;
  updatedAt:     Date;
}

export interface SessionFull extends SessionMeta {
  transcript?: string | null;
  summary?:    string | null;
  notes?:      string | null;
  quiz?:       any;
  segments?:   any;
  flashcards?: any;
  chapters?:   any; 
  revision?:   any;  // ← NEW — Prisma JsonValue → 
}

export interface User {
  id:    string;
  name:  string;
  email: string;
}

export function isTerminalStatus(status: SessionStatus): boolean {
  return status === "READY" || status === "ERROR";
}

export function isProcessingStatus(status: SessionStatus): boolean {
  return !isTerminalStatus(status);
}

interface StudyLensStore {
  user:                User | null;
  sessions:            SessionMeta[];
  activeSessionId:     string | null;
  activeSessionFull:   SessionFull | null;
  activeTab:           ActiveTab;
  sidebarCollapsed:    boolean;
  hydrated:            boolean;

  setUser:             (u: User | null) => void;
  setSessions:         (sessions: SessionMeta[]) => void;
  addSession:          (s: SessionMeta) => void;
  updateSession:       (id: string, patch: Partial<SessionFull>) => void;
  removeSession:       (id: string) => void;
  setActiveSession:    (id: string | null, full?: SessionFull) => void;
  setActiveTab:        (t: ActiveTab) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setHydrated:         (v: boolean) => void;
}

export const useStore = create<StudyLensStore>((set) => ({
  user: null, sessions: [], activeSessionId: null,
  activeSessionFull: null, activeTab: "summary",
  sidebarCollapsed: false, hydrated: false,

  setUser:     (user)     => set({ user }),
  setSessions: (sessions) => set({ sessions }),
  addSession:  (s)        => set((st) => ({ sessions: [s, ...st.sessions] })),

  updateSession: (id, patch) =>
    set((st) => ({
      sessions: st.sessions.map((s) => s.id === id ? { ...s, ...patch } : s),
      activeSessionFull:
        st.activeSessionId === id
          ? { ...st.activeSessionFull!, ...patch }
          : st.activeSessionFull,
    })),

  removeSession: (id) =>
    set((st) => ({
      sessions:          st.sessions.filter((s) => s.id !== id),
      activeSessionId:   st.activeSessionId === id ? null : st.activeSessionId,
      activeSessionFull: st.activeSessionId === id ? null : st.activeSessionFull,
    })),

  setActiveSession: (id, full) =>
    set({ activeSessionId: id, activeSessionFull: full ?? null, activeTab: "summary" }),

  setActiveTab:        (t) => set({ activeTab: t }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setHydrated:         (v) => set({ hydrated: v }),
}));