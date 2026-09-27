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

export interface Flashcard {
  front: string;
  back: string;
}

export interface Chapter {
  title: string;
  start: number;
  end: number;
  summary: string;
}

// ── Knowledge Base Types ──────────────────────────────────────────────────────
export interface KBTopic {
  name: string;
  subtopics?: string[];
  importance?: number;
}

export interface KBConcept {
  term: string;
  definition: string;
  context?: string;
  timestamp?: number;
}

export interface KBKeyFact {
  fact: string;
  sourceTimestamp?: number;
  importance?: number;
}

export interface KBRelationship {
  from: string;
  to: string;
  type: string;
}

export interface KnowledgeBaseData {
  id?: string;
  sessionId?: string;
  cleanedTranscript?: string;
  status: "PENDING" | "BUILDING" | "EXTRACTING" | "EMBEDDING" | "READY" | "ERROR";
  topics?: KBTopic[];
  concepts?: KBConcept[];
  keyFacts?: KBKeyFact[];
  relationships?: KBRelationship[];
  learningObjectives?: string[];
  chapters?: Chapter[];
  createdAt?: string;
  updatedAt?: string;
}

export type SessionStatus =
  | "PROCESSING"
  | "DOWNLOADING"
  | "EXTRACTING_AUDIO"
  | "TRANSCRIBING"
  | "BUILDING_KNOWLEDGE_BASE"
  | "KNOWLEDGE_BASE_READY"
  | "GENERATING_EMBEDDINGS"
  | "GENERATING_FEATURES"
  | "GENERATING_SUMMARY"
  | "GENERATING_NOTES"
  | "GENERATING_QUIZ"
  | "GENERATING_FLASHCARDS"
  | "READY"
  | "ERROR";

export type SessionSource = "UPLOAD" | "YOUTUBE";

export interface Session {
  id: string;
  title: string;
  source: SessionSource;
  thumbnail?: string | null;
  duration?: number | null;
  createdAt: string;
  updatedAt?: string;
  status: SessionStatus;
  errorMessage?: string | null;

  // AI-generated artifacts
  videoUrl?: string | null;
  videoId?: string | null;
  transcript?: string | null;
  segments?: Segment[] | null;
  summary?: string | null;
  notes?: string | null;
  quiz?: QuizItem[] | null;
  flashcards?: Flashcard[] | null;
  chapters?: Chapter[] | null;
  revision?: any;
  knowledgeBase?: KnowledgeBaseData | null;
}

export type ActiveTab =
  | "summary"
  | "notes"
  | "quiz"
  | "transcript"
  | "chat"
  | "flashcards"
  | "chapters"
  | "tutor"
  | "revision";
