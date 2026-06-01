// Shared wrapper for login + register pages
export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <style>{`
        .auth-shell {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: var(--font-body);
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
        }

        /* ── Logo ── */
        .auth-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 36px;
        }
        .auth-logo-mark {
          width: 34px; height: 34px;
          background: var(--accent);
          color: #0a0a0c;
          border-radius: 9px;
          font-family: var(--font-display);
          font-size: 14px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .auth-logo-text {
          font-family: var(--font-display);
          font-size: 19px;
          letter-spacing: -0.01em;
          color: var(--text);
        }

        /* ── Heading ── */
        .auth-heading {
          font-family: var(--font-display);
          font-size: 28px;
          letter-spacing: -0.02em;
          color: var(--text);
          margin-bottom: 6px;
          line-height: 1.1;
        }
        .auth-sub {
          font-size: 14px;
          color: var(--text2);
          margin-bottom: 32px;
          font-weight: 300;
        }

        /* ── Form elements ── */
        .auth-form { display: flex; flex-direction: column; gap: 16px; }

        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text2);
          letter-spacing: 0.02em;
        }
        .field-input {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 14px;
          color: var(--text);
          font-family: var(--font-body);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
        }
        .field-input::placeholder { color: var(--muted); }
        .field-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(200, 169, 110, 0.12);
        }
        .field-input.error-input { border-color: var(--danger); }
        .field-input.error-input:focus {
          box-shadow: 0 0 0 3px rgba(201, 110, 110, 0.12);
        }
        .field-error {
          font-size: 12px;
          color: var(--danger);
          font-family: var(--font-mono);
        }

        /* ── Password toggle ── */
        .password-wrap { position: relative; }
        .password-toggle {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: var(--muted); cursor: pointer;
          font-size: 13px; padding: 2px 4px;
          transition: color 0.15s;
        }
        .password-toggle:hover { color: var(--text2); }

        /* ── Submit button ── */
        .auth-submit {
          width: 100%; padding: 13px;
          background: var(--accent); color: #0a0a0c;
          border: none; border-radius: 10px;
          font-family: var(--font-body);
          font-size: 15px; font-weight: 500;
          cursor: pointer; margin-top: 4px;
          transition: opacity 0.15s, transform 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .auth-submit:hover { opacity: 0.88; transform: translateY(-1px); }
        .auth-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        /* ── Global error banner ── */
        .auth-error-banner {
          background: #1a0c0c;
          border: 1px solid var(--danger);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 13px;
          color: var(--danger);
          display: flex; align-items: center; gap: 8px;
        }

        /* ── Divider ── */
        .auth-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 4px 0;
        }
        .auth-divider-line { flex: 1; height: 1px; background: var(--border); }
        .auth-divider-text {
          font-size: 11px; color: var(--muted);
          font-family: var(--font-mono);
        }

        /* ── Footer link ── */
        .auth-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: var(--text2);
        }
        .auth-footer a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 500;
        }
        .auth-footer a:hover { text-decoration: underline; }

        /* ── Password strength ── */
        .pw-strength { display: flex; gap: 4px; margin-top: 6px; }
        .pw-bar {
          flex: 1; height: 3px; border-radius: 2px;
          background: var(--border);
          transition: background 0.2s;
        }
        .pw-bar.active-weak   { background: var(--danger); }
        .pw-bar.active-medium { background: var(--accent); }
        .pw-bar.active-strong { background: var(--success); }
        .pw-label {
          font-size: 11px;
          font-family: var(--font-mono);
          margin-top: 4px;
        }
        .pw-label.weak   { color: var(--danger); }
        .pw-label.medium { color: var(--accent); }
        .pw-label.strong { color: var(--success); }

        /* Spinner */
        .spin { animation: spin 0.8s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-mark">SL</div>
            <span className="auth-logo-text">StudyLens</span>
          </div>
          <h1 className="auth-heading">{title}</h1>
          <p className="auth-sub">{subtitle}</p>
          {children}
        </div>
      </div>
    </>
  );
}