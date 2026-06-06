// lib/api-client.ts
// aiApi no longer sends Bearer token — FastAPI auth removed.
// Auth is handled entirely by Next.js Server Actions + cookies.

import axios, { AxiosError } from "axios";

const AI_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// ── Auth API (Next.js routes) ─────────────────────────────────────────────────
export const authApi = axios.create({
  baseURL:         "/api/auth",
  withCredentials: true,
});

// ── AI API (FastAPI — no auth header needed) ──────────────────────────────────
export const aiApi = axios.create({
  baseURL: AI_BASE,
});

// ── Auth calls ────────────────────────────────────────────────────────────────

export async function loginAPI(data: { email: string; password: string }) {
  const { data: res } = await authApi.post("/login", data);
  return res;
}

export async function registerAPI(data: {
  name: string; email: string; password: string;
}) {
  const { data: res } = await authApi.post("/register", data);
  return res;
}

export async function logoutAPI() {
  const { data: res } = await authApi.post("/logout");
  return res;
}

export async function getMeAPI() {
  const { data: res } = await authApi.get("/me");
  return res;
}

// ── AI calls ──────────────────────────────────────────────────────────────────
// Note: uploadVideoAPI and downloadYouTubeAPI are no longer used directly —
// useSession.ts calls aiApi directly to pass session_id + user_id as form fields.

export async function askQuestionAPI(question: string, videoId?: string) {
  const { data } = await aiApi.post("/qa/", {
    question,
    video_id: videoId,
  });
  return data;
}

export async function searchTranscriptAPI(
  query:    string,
  videoId?: string,
  nResults  = 8,
) {
  const { data } = await aiApi.post("/search/", {
    query,
    video_id:  videoId,
    n_results: nResults,
  });
  return data;
}

export async function getHealthAPI() {
  const { data } = await aiApi.get("/health/");
  return data;
}