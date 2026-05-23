import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const api = axios.create({ baseURL: BASE });

export async function uploadVideo(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/upload/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function downloadYouTube(url: string) {
  const { data } = await api.post("/youtube/", { url });
  return data;
}

export async function askQuestion(question: string, videoId?: string) {
  const { data } = await api.post("/qa/", { question, video_id: videoId });
  return data;
}

export async function searchTranscript(query: string, videoId?: string, nResults = 8) {
  const { data } = await api.post("/search/", {
    query,
    video_id: videoId,
    n_results: nResults,
  });
  return data;
}

export async function getHealth() {
  const { data } = await api.get("/health/");
  return data;
}