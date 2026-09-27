"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Sparkles,
  LayoutDashboard,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { logoutAction } from "@/actions/auth.actions";

export function UserMenu() {
  const { user, setUser, sessions } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const totalSessions = sessions.length;
  const readySessions = sessions.filter((s) => s.status === "READY").length;

  function handleLogout() {
    startTransition(async () => {
      try {
        await logoutAction();
      } catch {}
      setUser(null);
      router.push("/login");
    });
  }

  return (
    <div className="relative w-full">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-[#1A2830] bg-[#0A1014] p-2 transition-all hover:border-[#00D9C0]/50 hover:bg-[#152025]"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#00D9C0] to-[#FF3347] font-mono text-xs font-bold text-white shadow-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="truncate text-xs font-semibold text-[#F5F7F7]">{user.name}</p>
          <p className="font-mono text-[10px] text-[#8B9A9D]">Free Plan</p>
        </div>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-[#8B9A9D]" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-[#8B9A9D]" />
        )}
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-50 overflow-hidden rounded-2xl border border-[#1A2830] bg-[#0A1014] shadow-2xl shadow-black/80"
            >
              {/* Profile Card Header */}
              <div className="border-b border-[#1A2830] bg-gradient-to-br from-[#111A1F] to-[#0A1014] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00D9C0] to-[#FF3347] font-mono text-sm font-bold text-white shadow-md shadow-[#00D9C0]/20">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#F5F7F7]">{user.name}</p>
                    <p className="truncate font-mono text-xs text-[#8B9A9D]">{user.email}</p>
                  </div>
                </div>

                {/* Micro Stats */}
                <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-[#1A2830]/60 pt-3 text-center">
                  <div className="rounded-lg bg-[#05090B] p-1.5 border border-[#1A2830]">
                    <span className="font-mono text-xs font-bold text-[#00D9C0]">
                      {totalSessions}
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider text-[#8B9A9D]">
                      Lectures
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#05090B] p-1.5 border border-[#1A2830]">
                    <span className="font-mono text-xs font-bold text-[#00D9C0]">
                      {readySessions}
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider text-[#8B9A9D]">
                      Indexed
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-1.5 space-y-0.5 bg-[#0D1519]">
                <button
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#8B9A9D] hover:bg-[#152025] hover:text-white"
                >
                  <LayoutDashboard className="h-4 w-4 text-[#00D9C0]" />
                  <span>Workspace</span>
                </button>

                <button
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-[#8B9A9D] hover:bg-[#152025] hover:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-[#00D9C0]" />
                    <span>Knowledge Graph</span>
                  </div>
                  <span className="rounded bg-[#00D9C0]/10 px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#00D9C0]">
                    Pro
                  </span>
                </button>

                <div className="my-1 h-px bg-[#1A2830]" />

                <button
                  onClick={handleLogout}
                  disabled={isPending}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#FF3347] hover:bg-[#FF3347]/10 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  <span>{isPending ? "Logging out…" : "Log out"}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}