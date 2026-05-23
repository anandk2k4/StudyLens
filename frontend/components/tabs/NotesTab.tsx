"use client";

export function NotesTab({ notes }: { notes: string }) {
  const lines = notes
    .split("\n")
    .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);

  return (
    <div className="tab-content">
      <ul className="notes-list">
        {lines.map((line, i) => (
          <li key={i} className="note-item">
            <span className="note-bullet">◆</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}