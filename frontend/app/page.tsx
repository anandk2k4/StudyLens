"use client";

import Link from "next/link";

const FEATURES = [
  { icon: "📄", title: "AI Summary",       desc: "Key points extracted in seconds from any lecture" },
  { icon: "📝", title: "Smart Notes",       desc: "Structured bullet notes generated automatically" },
  { icon: "🧠", title: "Knowledge Quiz",    desc: "Test yourself with AI-generated MCQs" },
  { icon: "🔍", title: "Semantic Search",   desc: "Search your transcript by concept, not just keywords" },
  { icon: "💬", title: "Ask the Video",     desc: "RAG-powered Q&A grounded in the actual content" },
  { icon: "⏱",  title: "Timeline Seek",    desc: "Click any transcript segment to jump to that moment" },
];

const STEPS = [
  { n: "01", title: "Upload or paste",  desc: "Drop a video file or paste a YouTube link" },
  { n: "02", title: "AI processes it",  desc: "Whisper transcribes, Llama summarises, embeds, and quizzes" },
  { n: "03", title: "Learn smarter",    desc: "Study from your dashboard — saved forever, revisit anytime" },
];

export default function LandingPage() {
  return (
    <>
      <style>{`
        .landing { min-height: 100vh; background: var(--bg); color: var(--text); font-family: var(--font-body); }

        /* ── Nav ── */
        .nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 48px; border-bottom: 1px solid var(--border);
          position: sticky; top: 0; background: var(--bg);
          backdrop-filter: blur(12px); z-index: 10;
        }
        .nav-logo { display: flex; align-items: center; gap: 10px; }
        .nav-logo-mark {
          width: 32px; height: 32px; background: var(--accent);
          color: #0a0a0c; border-radius: 8px;
          font-family: var(--font-display); font-size: 14px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .nav-logo-text { font-family: var(--font-display); font-size: 18px; letter-spacing: -0.01em; }
        .nav-links { display: flex; align-items: center; gap: 12px; }
        .btn-ghost {
          padding: 8px 18px; border-radius: 8px;
          background: none; border: 1px solid var(--border);
          color: var(--text2); font-size: 14px; font-family: var(--font-body);
          cursor: pointer; text-decoration: none;
          transition: border-color 0.15s, color 0.15s;
          display: inline-flex; align-items: center;
        }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
        .btn-accent {
          padding: 8px 20px; border-radius: 8px;
          background: var(--accent); border: none;
          color: #0a0a0c; font-size: 14px; font-weight: 500;
          font-family: var(--font-body); cursor: pointer;
          text-decoration: none; display: inline-flex; align-items: center;
          transition: opacity 0.15s;
        }
        .btn-accent:hover { opacity: 0.85; }

        /* ── Hero ── */
        .hero {
          max-width: 860px; margin: 0 auto;
          padding: 96px 32px 80px; text-align: center;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 11px;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--accent); background: #1a1508;
          border: 1px solid #2a2010; padding: 5px 14px;
          border-radius: 20px; margin-bottom: 28px;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(40px, 7vw, 72px);
          line-height: 1.05; letter-spacing: -0.03em;
          color: var(--text); margin-bottom: 20px;
        }
        .hero-title em { font-style: italic; color: var(--accent); }
        .hero-sub {
          font-size: 17px; color: var(--text2);
          max-width: 520px; margin: 0 auto 40px;
          line-height: 1.75; font-weight: 300;
        }
        .hero-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-lg {
          padding: 14px 32px; border-radius: 10px; font-size: 15px;
          font-family: var(--font-body); font-weight: 500;
          cursor: pointer; text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          transition: opacity 0.15s, transform 0.15s;
        }
        .btn-lg:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-primary-lg { background: var(--accent); color: #0a0a0c; border: none; }
        .btn-secondary-lg {
          background: none; color: var(--text);
          border: 1px solid var(--border);
        }
        .btn-secondary-lg:hover { border-color: var(--text2); }

        /* ── Social proof strip ── */
        .proof-strip {
          border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
          padding: 14px 48px; display: flex; gap: 32px;
          justify-content: center; flex-wrap: wrap;
        }
        .proof-item {
          font-family: var(--font-mono); font-size: 11px;
          color: var(--muted); letter-spacing: 0.08em;
          display: flex; align-items: center; gap: 6px;
        }
        .proof-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--success); }

        /* ── Features ── */
        .section { max-width: 920px; margin: 0 auto; padding: 80px 32px; }
        .section-label {
          font-family: var(--font-mono); font-size: 10px;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 14px;
        }
        .section-title {
          font-family: var(--font-display); font-size: clamp(28px, 4vw, 42px);
          letter-spacing: -0.02em; margin-bottom: 48px; line-height: 1.1;
        }
        .features-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .feature-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 24px;
          transition: border-color 0.15s;
        }
        .feature-card:hover { border-color: var(--border2); }
        .feature-icon { font-size: 22px; margin-bottom: 12px; }
        .feature-title { font-size: 15px; font-weight: 500; margin-bottom: 6px; }
        .feature-desc { font-size: 13px; color: var(--text2); line-height: 1.6; }

        /* ── How it works ── */
        .steps { display: flex; flex-direction: column; gap: 0; }
        .step {
          display: flex; gap: 28px; align-items: flex-start;
          padding: 28px 0; border-bottom: 1px solid var(--border);
        }
        .step:last-child { border-bottom: none; }
        .step-num {
          font-family: var(--font-mono); font-size: 11px;
          color: var(--accent); background: #1a1508;
          border: 1px solid #2a2010; padding: 4px 10px;
          border-radius: 6px; flex-shrink: 0; margin-top: 2px;
        }
        .step-title { font-size: 16px; font-weight: 500; margin-bottom: 4px; }
        .step-desc { font-size: 14px; color: var(--text2); line-height: 1.6; }

        /* ── CTA banner ── */
        .cta-banner {
          margin: 0 32px 80px; max-width: 860px; margin-left: auto; margin-right: auto;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 18px; padding: 52px 40px; text-align: center;
        }
        .cta-title {
          font-family: var(--font-display); font-size: clamp(24px, 3.5vw, 36px);
          letter-spacing: -0.02em; margin-bottom: 14px;
        }
        .cta-sub { color: var(--text2); font-size: 15px; margin-bottom: 32px; font-weight: 300; }

        /* ── Footer ── */
        .footer {
          border-top: 1px solid var(--border);
          padding: 20px 48px; display: flex;
          align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
        }
        .footer-logo { font-family: var(--font-display); font-size: 15px; color: var(--text2); }
        .footer-note { font-family: var(--font-mono); font-size: 10px; color: var(--muted); }
      `}</style>

      <div className="landing">

        {/* ── Nav ── */}
        <nav className="nav">
          <div className="nav-logo">
            <div className="nav-logo-mark">SL</div>
            <span className="nav-logo-text">StudyLens</span>
          </div>
          <div className="nav-links">
            <Link href="/login"    className="btn-ghost">Log in</Link>
            <Link href="/register" className="btn-accent">Get started →</Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-eyebrow">
            <span className="proof-dot" />
            AI-powered video learning
          </div>
          <h1 className="hero-title">
            Turn lectures into<br /><em>structured knowledge</em>
          </h1>
          <p className="hero-sub">
            Upload any video or paste a YouTube link. StudyLens transcribes, summarises,
            generates notes and quizzes — and lets you ask questions about the content.
          </p>
          <div className="hero-cta">
            <Link href="/register" className="btn-lg btn-primary-lg">Start learning free →</Link>
            <Link href="/login"    className="btn-lg btn-secondary-lg">Log in</Link>
          </div>
        </section>

        {/* ── Proof strip ── */}
        <div className="proof-strip">
          {["Whisper transcription", "Llama 3.1 summaries", "RAG-based Q&A", "Runs locally", "Persistent sessions"].map((t) => (
            <div key={t} className="proof-item">
              <span className="proof-dot" />
              {t}
            </div>
          ))}
        </div>

        {/* ── Features ── */}
        <section className="section">
          <p className="section-label">Features</p>
          <h2 className="section-title">Everything you need<br />to learn from video</h2>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <p className="feature-title">{f.title}</p>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="section" style={{ paddingTop: 0 }}>
          <p className="section-label">How it works</p>
          <h2 className="section-title">Three steps to<br />smarter studying</h2>
          <div className="steps">
            {STEPS.map((s) => (
              <div key={s.n} className="step">
                <span className="step-num">{s.n}</span>
                <div>
                  <p className="step-title">{s.title}</p>
                  <p className="step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="cta-banner">
          <h2 className="cta-title">Ready to study smarter?</h2>
          <p className="cta-sub">Create a free account and upload your first lecture in under a minute.</p>
          <Link href="/register" className="btn-lg btn-primary-lg">Get started free →</Link>
        </div>

        {/* ── Footer ── */}
        <footer className="footer">
          <span className="footer-logo">StudyLens AI</span>
          <span className="footer-note">Built with Whisper · Llama 3.1 · ChromaDB · Neon</span>
        </footer>

      </div>
    </>
  );
}