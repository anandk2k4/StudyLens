import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Session, ActiveTab } from "@/types";

interface StudyLensStore {
  // Sessions
  sessions: Session[];
  activeSessionId: string | null;

  // UI state
  activeTab: ActiveTab;
  sidebarCollapsed: boolean;

  // Actions
  addSession: (session: Session) => void;
  updateSession: (id: string, patch: Partial<Session>) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useStore = create<StudyLensStore>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,
      activeTab: "summary",
      sidebarCollapsed: false,

      addSession: (session) =>
        set((s) => ({ sessions: [session, ...s.sessions] })),

      updateSession: (id, patch) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === id ? { ...sess, ...patch } : sess
          ),
        })),

      removeSession: (id) =>
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.id !== id),
          activeSessionId:
            s.activeSessionId === id ? null : s.activeSessionId,
        })),

      setActiveSession: (id) =>
        set({ activeSessionId: id, activeTab: "summary" }),

      setActiveTab: (tab) => set({ activeTab: tab }),

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    }),
    {
      name: "studylens-store",
      // Only persist sessions — UI state is ephemeral
      partialize: (s) => ({ sessions: s.sessions }),
    }
  )
);

// Derived selector
export const useActiveSession = () => {
  const { sessions, activeSessionId } = useStore();
  return sessions.find((s) => s.id === activeSessionId) ?? null;
};