// components/workspace/ProcessingIndicator.tsx
// Shows detailed processing stage with animated progress bar
"use client";

import { getStatusLabel } from "@/hooks/usePolling";

const STAGE_ORDER = [
  "DOWNLOADING",
  "EXTRACTING_AUDIO",
  "TRANSCRIBING",
  "GENERATING_EMBEDDINGS",
  "GENERATING_SUMMARY",
  "READY",
];

function getProgress(status: string): number {
  const idx = STAGE_ORDER.indexOf(status);
  if (idx === -1) return 5;
  return Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
}

export function ProcessingIndicator({ status }: { status: string }) {
  const label    = getStatusLabel(status);
  const progress = getProgress(status);

  return (
    <>
      <style>{`
        .pi-wrap {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 100vh; padding: 48px; gap: 16px;
          text-align: center;
        }
        .pi-spinner {
          font-size: 40px; color: var(--accent);
          animation: spin 1.2s linear infinite;
        }
        .pi-title {
          font-family: var(--font-display);
          font-size: 26px; letter-spacing: -0.01em;
        }
        .pi-stage {
          font-family: var(--font-mono);
          font-size: 13px; color: var(--accent);
          letter-spacing: 0.06em;
        }
        .pi-bar-wrap {
          width: 300px; height: 4px;
          background: var(--border); border-radius: 2px;
          overflow: hidden; margin-top: 4px;
        }
        .pi-bar-fill {
          height: 100%; background: var(--accent);
          border-radius: 2px;
          transition: width 0.6s ease;
        }
        .pi-hint {
          font-size: 12px; color: var(--muted);
          max-width: 340px; line-height: 1.6;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="pi-wrap">
        <div className="pi-spinner">⟳</div>
        <h2 className="pi-title">Processing Video</h2>
        <p className="pi-stage">{label}</p>
        <div className="pi-bar-wrap">
          <div className="pi-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="pi-hint">
          You can close this tab. Your session will continue processing
          and be ready when you return.
        </p>
      </div>
    </>
  );
}