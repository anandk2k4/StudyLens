// lib/api-client.ts — askAllSessionsAPI now returns structured sections

import axios from "axios";

const AI_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const authApi = axios.create({ baseURL: "/api/auth", withCredentials: true });
export const aiApi   = axios.create({ baseURL: AI_BASE });

export async function loginAPI(data: { email: string; password: string }) {
  const { data: res } = await authApi.post("/login", data); return res;
}
export async function registerAPI(data: { name: string; email: string; password: string }) {
  const { data: res } = await authApi.post("/register", data); return res;
}
export async function logoutAPI() {
  const { data: res } = await authApi.post("/logout"); return res;
}
export async function getMeAPI() {
  const { data: res } = await authApi.get("/me"); return res;
}

export async function askQuestionAPI(question: string, videoId?: string) {
  const { data } = await aiApi.post("/qa/", { question, video_id: videoId });
  return data;
}

// ── Multi-session — now returns { answer, sections, sources } ────────────────
export interface AnswerSection {
  heading: string;
  type:    "lecture" | "themes" | "differences" | "conclusion" | "other";
  content: string;
}

export interface MultiSessionAnswer {
  question: string;
  answer:   string;
  sections: AnswerSection[];
  sources:  { session_id: string; title: string; source: string }[];
}

export async function askAllSessionsAPI(
  question: string,
  userId:   string
): Promise<MultiSessionAnswer> {
  const { data } = await aiApi.post("/qa/all", { question, user_id: userId });
  return data;
}

export async function searchTranscriptAPI(query: string, videoId?: string, nResults = 8) {
  const { data } = await aiApi.post("/search/", {
    query, video_id: videoId, n_results: nResults,
  });
  return data;
}

export async function getHealthAPI() {
  const { data } = await aiApi.get("/health/"); return data;
}

export interface TutorResponse {
  concept:             string;
  example:             string;
  analogy:             string;
  key_takeaways:       string[];   // ← NEW
  practice_question:   string;
  difficulty:           string;
  follow_up_questions: string[];
}


export async function askTutorAPI(params: {
  sessionId:    string;
  question:     string;
  difficulty:   "beginner" | "intermediate" | "advanced";
  chapter?:     { title: string; start: number; end: number; summary?: string } | null;
  allSegments?: { text: string; start: number; end: number }[];
}): Promise<TutorResponse> {
  const { data } = await aiApi.post("/tutor/", {
    session_id:   params.sessionId,
    question:     params.question,
    difficulty:   params.difficulty,
    chapter:      params.chapter ?? null,
    all_segments: params.allSegments ?? null,
  });
  return data;
}


export interface RevisionData {
  quick_revision:    string;
  detailed_revision: string;
  cheat_sheet:       string[];
  key_concepts:      { concept: string; definition: string }[];
  common_mistakes:   string[];
  memory_tricks:     { trick: string; explanation: string }[];
  exam_questions:    { question: string; hint: string }[];
  final_checklist:   string[];
  cached?:           boolean;
}
 
export async function generateRevisionAPI(params: {
  sessionId:      string;
  userId:         string;
  difficulty?:    "beginner" | "intermediate" | "advanced";
  title?:         string;
  summary?:       string | null;
  notes?:         string | null;
  chapters?:      any[] | null;
  quiz?:          any[] | null;
  flashcards?:    any[] | null;
  cachedRevision?:any | null;
}): Promise<RevisionData> {
  const { data } = await aiApi.post("/revision/", {
    session_id:      params.sessionId,
    user_id:         params.userId,
    difficulty:      params.difficulty ?? "intermediate",
    title:           params.title ?? "",
    summary:         params.summary ?? null,
    notes:           params.notes ?? null,
    chapters:        params.chapters ?? null,
    quiz:            params.quiz ?? null,
    flashcards:      params.flashcards ?? null,
    cached_revision: params.cachedRevision ?? null,
  });
  return data;
}
 