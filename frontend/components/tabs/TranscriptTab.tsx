"use client";

import { useState } from "react";
import { Segment } from "@/types";
import { searchTranscript } from "@/lib/api";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function TranscriptTab({
  segments,
  videoId,
  onSeek,
}: {
  segments: Segment[];
  videoId?: string;
  onSeek: (t: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Segment[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch() {
    if (!query.trim()) { setResults(null); return; }
    setSearching(true);
    try {
      const data = await searchTranscript(query, videoId);
      setResults(data.results);
    } finally {
      setSearching(false);
    }
  }

  const displayed = results ?? segments;

  return (
    <div className="tab-content">
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search transcript semantically…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="search-btn" onClick={handleSearch} disabled={searching}>
          {searching ? "…" : "Search"}
        </button>
        {results && (
          <button className="clear-btn" onClick={() => { setResults(null); setQuery(""); }}>
            Clear
          </button>
        )}
      </div>
      {results && (
        <p className="search-count">{results.length} results for "{query}"</p>
      )}
      <div className="segments-list">
        {displayed.map((seg, i) => (
          <div key={i} className="segment-row" onClick={() => onSeek(seg.start)}>
            <span className="seg-time">{fmt(seg.start)}</span>
            <p className="seg-text">{seg.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}