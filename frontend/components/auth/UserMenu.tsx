"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { logoutAction } from "@/actions/auth.actions";

export function UserMenu() {
  const { user, setUser, sessions } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  const initials = user.name
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const totalSessions = sessions.length;
  const readySessions = sessions.filter((s) => s.status === "READY").length;

  function handleLogout() {
    startTransition(async () => {
      try { await logoutAction(); } catch {}
      setUser(null);
      router.push("/login");
    });
  }

  return (
    <>
      <style>{`
        /* ── Trigger button ── */
        .um-trigger {
          display: flex; align-items: center; gap: 9px;
          width: 100%; padding: 8px 10px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px; cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .um-trigger:hover { border-color: var(--accent); background: var(--surface); }

        .um-avatar {
          width: 30px; height: 30px; border-radius: 8px;
          background: linear-gradient(135deg, #c8a96e 0%, #8b6f3e 100%);
          color: #0a0a0c; font-family: var(--font-mono);
          font-size: 11px; font-weight: 700; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          letter-spacing: 0.02em;
        }

        .um-info { flex: 1; min-width: 0; text-align: left; }
        .um-name {
          font-size: 12px; font-weight: 500; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          line-height: 1.3;
        }
        .um-role {
          font-size: 10px; color: var(--muted);
          font-family: var(--font-mono); line-height: 1.3;
        }
        .um-chevron {
          font-size: 10px; color: var(--muted); flex-shrink: 0;
          transition: transform 0.2s;
        }
        .um-chevron.open { transform: rotate(180deg); }

        /* ── Dropdown ── */
        .um-dropdown {
          position: absolute; bottom: calc(100% + 10px); left: 0; right: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px; overflow: hidden;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.5);
          z-index: 50;
        }

        /* Profile header */
        .um-profile {
          padding: 16px;
          background: linear-gradient(135deg, #141210 0%, #1a1610 100%);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 12px;
        }
        .um-profile-avatar {
          width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
          background: linear-gradient(135deg, #c8a96e 0%, #8b6f3e 100%);
          color: #0a0a0c; font-family: var(--font-mono);
          font-size: 15px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          letter-spacing: 0.02em;
          border: 2px solid rgba(200,169,110,0.3);
        }
        .um-profile-info { flex: 1; min-width: 0; }
        .um-profile-name {
          font-size: 14px; font-weight: 500; color: var(--text);
          margin-bottom: 2px; line-height: 1.3;
        }
        .um-profile-email {
          font-size: 11px; color: var(--muted);
          font-family: var(--font-mono);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* Stats row */
        .um-stats {
          display: flex;
          border-bottom: 1px solid var(--border);
        }
        .um-stat {
          flex: 1; padding: 10px 0; text-align: center;
          border-right: 1px solid var(--border);
        }
        .um-stat:last-child { border-right: none; }
        .um-stat-value {
          font-family: var(--font-mono); font-size: 16px;
          font-weight: 500; color: var(--accent); line-height: 1.2;
        }
        .um-stat-label {
          font-size: 9px; color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-top: 2px;
        }

        /* Menu items */
        .um-menu { padding: 6px; }
        .um-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 8px;
          font-size: 13px; color: var(--text2);
          cursor: pointer; background: none; border: none;
          width: 100%; text-align: left;
          font-family: var(--font-body);
          transition: background 0.12s, color 0.12s;
        }
        .um-item:hover { background: var(--surface2); color: var(--text); }
        .um-item-icon { font-size: 14px; width: 20px; text-align: center; flex-shrink: 0; }
        .um-item-text { flex: 1; }
        .um-item-badge {
          font-family: var(--font-mono); font-size: 9px;
          background: var(--surface2); border: 1px solid var(--border);
          padding: 1px 6px; border-radius: 4px; color: var(--muted);
        }

        .um-divider { height: 1px; background: var(--border); margin: 4px 6px; }

        .um-item.logout { color: var(--danger); }
        .um-item.logout:hover { background: #1a0c0c; color: var(--danger); }

        /* Overlay */
        .um-overlay { position: fixed; inset: 0; z-index: 40; }
      `}</style>

      <div style={{ position: "relative", width: "100%" }}>

        {/* Trigger */}
        <button className="um-trigger" onClick={() => setOpen((v) => !v)}>
          <div className="um-avatar">{initials}</div>
          <div className="um-info">
            <p className="um-name">{user.name}</p>
            <p className="um-role">Free plan</p>
          </div>
          <span className={`um-chevron ${open ? "open" : ""}`}>▲</span>
        </button>

        {open && (
          <>
            <div className="um-overlay" onClick={() => setOpen(false)} />
            <div className="um-dropdown">

              {/* Profile header */}
              <div className="um-profile">
                <div className="um-profile-avatar">{initials}</div>
                <div className="um-profile-info">
                  <p className="um-profile-name">{user.name}</p>
                  <p className="um-profile-email">{user.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="um-stats">
                <div className="um-stat">
                  <p className="um-stat-value">{totalSessions}</p>
                  <p className="um-stat-label">Sessions</p>
                </div>
                <div className="um-stat">
                  <p className="um-stat-value">{readySessions}</p>
                  <p className="um-stat-label">Completed</p>
                </div>
                <div className="um-stat">
                  <p className="um-stat-value">
                    {totalSessions > 0
                      ? Math.round((readySessions / totalSessions) * 100)
                      : 0}%
                  </p>
                  <p className="um-stat-label">Success</p>
                </div>
              </div>

              {/* Menu */}
              <div className="um-menu">
                <button className="um-item" onClick={() => setOpen(false)}>
                  <span className="um-item-icon">◈</span>
                  <span className="um-item-text">Dashboard</span>
                </button>

                <button className="um-item" onClick={() => setOpen(false)}>
                  <span className="um-item-icon">⚙</span>
                  <span className="um-item-text">Settings</span>
                  <span className="um-item-badge">Soon</span>
                </button>

                <button className="um-item" onClick={() => setOpen(false)}>
                  <span className="um-item-icon">✦</span>
                  <span className="um-item-text">Upgrade plan</span>
                  <span className="um-item-badge">Pro</span>
                </button>

                <div className="um-divider" />

                <button
                  className="um-item logout"
                  onClick={handleLogout}
                  disabled={isPending}
                >
                  <span className="um-item-icon">{isPending ? "⟳" : "↩"}</span>
                  <span className="um-item-text">
                    {isPending ? "Logging out…" : "Log out"}
                  </span>
                </button>
              </div>

            </div>
          </>
        )}
      </div>
    </>
  );
}