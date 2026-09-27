"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, X, FileCode, Clock, Loader2 } from "lucide-react";
import { Segment } from "@/lib/store";
import { searchTranscriptAPI } from "@/lib/api-client";

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

export function TranscriptTab({
  segments,
  videoId,
  onSeek,
}: {
  segments: any;
  videoId?: string;
  onSeek: (t: number) => void;
}) {
  const items = (segments as Segment[]) ?? [];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Segment[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch() {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      const data = await searchTranscriptAPI(query, videoId);
      setResults(data.results as Segment[]);
    } finally {
      setSearching(false);
    }
  }

  const displayed = results ?? items;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 border-b border-[#1A2830] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D9C0]/10 text-[#33E3D0]">
            <FileCode className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Interactive Transcript</h2>
            <p className="text-xs text-[#8B9A9D]">
              Timestamped transcript with semantic search and seeking
            </p>
          </div>
        </div>

        {/* Semantic search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-[#4A5B62]" />
            <input
              className="w-56 rounded-xl border border-[#1A2830] bg-[#0D1519] py-2 pl-9 pr-8 text-xs text-white placeholder-[#4A5B62] outline-none transition-colors focus:border-[#00D9C0] sm:w-64"
              placeholder="Search concepts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults(null);
                }}
                className="absolute right-2.5 text-[#4A5B62] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00D9C0] to-[#00B09D] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-40"
          >
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span>Search</span>}
          </button>
        </div>
      </div>

      {results && (
        <div className="flex items-center justify-between text-xs text-[#8B9A9D]">
          <span>
            Found <strong className="text-white">{results.length}</strong> matching segments for &ldquo;{query}&rdquo;
          </span>
          <button
            onClick={() => {
              setResults(null);
              setQuery("");
            }}
            className="text-xs font-semibold text-[#00D9C0] hover:underline"
          >
            Reset view
          </button>
        </div>
      )}

      {/* Segments list */}
      <div className="space-y-2">
        {displayed.map((seg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            onClick={() => onSeek(seg.start)}
            className="group flex cursor-pointer items-start gap-3.5 rounded-xl border border-transparent p-3 transition-colors hover:border-[#1A2830] hover:bg-[#0D1519]"
          >
            <span className="flex items-center gap-1 shrink-0 rounded-md border border-[#00D9C0]/25 bg-[#00D9C0]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#00D9C0] group-hover:border-[#00D9C0] group-hover:text-white">
              <Clock className="h-3 w-3" />
              <span>{fmt(seg.start)}</span>
            </span>
            <p className="text-sm leading-relaxed text-[#F5F7F7] group-hover:text-white">
              {seg.text}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}