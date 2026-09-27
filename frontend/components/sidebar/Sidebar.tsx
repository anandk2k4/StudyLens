"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Library,
  GraduationCap,
  Sparkles,
  Layers,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore, ActiveView } from "@/lib/store";
import { getSessionsAction } from "@/actions/session.actions";
import { getCurrentUser } from "@/actions/auth.actions";
import { UserMenu } from "../auth/UserMenu";
import { StudyLensLogo } from "@/components/ui/StudyLensLogo";

// ── Silent token refresh ──────────────────────────────────────────────────────
async function silentRefresh(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

const NAV_ITEMS: { id: ActiveView; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "library", label: "My Library", icon: Library },
  { id: "tutor", label: "AI Tutor", icon: GraduationCap },
  { id: "revision", label: "Revision", icon: Sparkles },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "ask-ai", label: "Ask AI", icon: MessageSquare },
];

export function Sidebar() {
  const {
    sidebarCollapsed,
    setSessions,
    setSidebarCollapsed,
    setHydrated,
    setUser,
    activeSessionId,
    setActiveSession,
    activeView,
    setActiveView,
  } = useStore();

  // ── On mount: refresh token → load user → load sessions ──────────────────
  useEffect(() => {
    async function init() {
      let user = null;
      try {
        user = await getCurrentUser();
      } catch {}

      if (!user) {
        const refreshed = await silentRefresh();
        if (refreshed) {
          try {
            user = await getCurrentUser();
          } catch {}
        }
      }

      if (!user) {
        setHydrated(true);
        return;
      }

      setUser({ id: user.id, name: user.name, email: user.email });

      try {
        const dbSessions = await getSessionsAction();
        const cleaned = dbSessions.map((s: any) => ({
          ...s,
          status: s.status === "PROCESSING" ? "ERROR" : s.status,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
        setSessions(cleaned);
      } catch {}

      setHydrated(true);
    }

    init();
  }, [setHydrated, setSessions, setUser]);

  if (sidebarCollapsed) {
    return (
      <aside className="sidebar flex flex-col h-screen bg-[#0A1014] border-r border-[#1A2830] w-[72px] py-4 transition-all shrink-0">
        <button
          className="mb-6 mx-auto flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#152025] text-[#8B9A9D]"
          onClick={() => setSidebarCollapsed(false)}
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="mb-6 flex items-center justify-center">
          <StudyLensLogo size="sm" showText={false} />
        </div>
        
        <div className="flex-1 overflow-y-auto w-full no-scrollbar">
          <nav className="flex flex-col gap-2 w-full px-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    if (item.id === "dashboard") setActiveSession(null);
                    setSidebarCollapsed(false);
                  }}
                  className={`flex justify-center items-center h-10 w-full rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#00D9C0]/10 text-[#00D9C0]"
                      : "text-[#8B9A9D] hover:bg-[#152025] hover:text-[#F5F7F7]"
                  }`}
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto px-3 w-full flex flex-col gap-2">
          <div className="h-px w-full bg-[#1A2830] my-2" />
          <UserMenu />
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar flex flex-col h-screen bg-[#0A1014] border-r border-[#1A2830] w-64 transition-all shrink-0">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 mb-2 shrink-0">
        <StudyLensLogo size="sm" showText={true} />
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#8B9A9D] hover:bg-[#152025] hover:text-white transition-colors"
          onClick={() => setSidebarCollapsed(true)}
          title="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  if (item.id === "dashboard") setActiveSession(null);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#00D9C0]/10 text-[#00D9C0] border-l-2 border-[#00D9C0] -ml-[2px]"
                    : "text-[#8B9A9D] hover:bg-[#152025] hover:text-[#F5F7F7] ml-0 border-l-2 border-transparent"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings & User Menu */}
      <div className="px-3 pb-4 flex flex-col gap-2 shrink-0">
        <div className="h-px w-full bg-[#1A2830] my-2" />
        
        <button
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-[#8B9A9D] hover:bg-[#152025] hover:text-[#F5F7F7] border-l-2 border-transparent"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>

        <div className="mt-2">
          <UserMenu />
        </div>
      </div>
    </aside>
  );
}
