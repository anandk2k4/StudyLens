"use client";

export function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-glyph">◈</div>
      <h2 className="empty-title">Start Learning</h2>
      <p className="empty-sub">
        Upload a lecture video or paste a YouTube link in the sidebar to begin.
      </p>
      <div className="empty-features">
        {[
          ["📄", "AI Summary", "Key points in seconds"],
          ["📝", "Smart Notes", "Structured bullet notes"],
          ["🧠", "Quiz", "Test your knowledge"],
          ["🔍", "Search", "Semantic transcript search"],
          ["💬", "Ask AI", "RAG-powered Q&A"],
        ].map(([icon, title, sub]) => (
          <div key={title} className="empty-feature">
            <span className="ef-icon">{icon}</span>
            <span className="ef-title">{title}</span>
            <span className="ef-sub">{sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
