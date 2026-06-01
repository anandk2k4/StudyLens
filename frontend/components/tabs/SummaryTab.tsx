"use client";

export function SummaryTab({ summary }: { summary: string }) {
  return (
    <div className="tab-content">
      <p className="summary-text">{summary}</p>
    </div>
  );
}
