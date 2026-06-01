// ── API client — talks to FastAPI backend ─────────────────────────────────────
// This runs client-side only. It reads the access token from a non-HttpOnly
// cookie that is written alongside the HttpOnly refresh token.

import axios, { AxiosError } from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const apiClient = axios.create({ baseURL: BASE });

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  // Access token is stored in a readable cookie for client-side API calls
  const token = document.cookie
    .split("; ")
    .find((r) => r.startsWith("sl_access_token="))
    ?.split("=")[1];
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Silent token refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        await axios.post("/api/auth/refresh"); // Next.js API route handles it
        return apiClient.request(error.config!);
      } catch {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// ── Typed API calls ───────────────────────────────────────────────────────────

export async function uploadVideoAPI(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post("/upload/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function downloadYouTubeAPI(url: string) {
  const { data } = await apiClient.post("/youtube/", { url });
  return data;
}

export async function askQuestionAPI(question: string, videoId?: string) {
  const { data } = await apiClient.post("/qa/", {
    question,
    video_id: videoId,
  });
  return data;
}

export async function searchTranscriptAPI(
  query: string,
  videoId?: string,
  nResults = 8,
) {
  const { data } = await apiClient.post("/search/", {
    query,
    video_id: videoId,
    n_results: nResults,
  });
  return data;
}

export async function getHealthAPI() {
  const { data } = await apiClient.get("/health/");
  return data;
}
