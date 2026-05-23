// ── Core domain types ─────────────────────────────────────────────────────────

export interface Segment {
  text: string;
  start: number;
  end: number;
}

export interface QuizItem {
  question: string;
  options: string[];
  answer: string;
}

export type SessionStatus = "processing" | "ready" | "error";
export type SessionSource = "upload" | "youtube";

export interface Session {
  id: string;                  // UUID from backend
  title: string;               // video title or filename
  source: SessionSource;
  thumbnail?: string;          // first frame or YT thumbnail
  duration?: number;           // seconds
  createdAt: string;           // ISO date string
  status: SessionStatus;

  // Only present when status === "ready"
  videoUrl?: string;
  transcript?: string;
  segments?: Segment[];
  summary?: string;
  notes?: string;
  quiz?: QuizItem[];
}

export type ActiveTab = "summary" | "notes" | "quiz" | "transcript" | "chat";