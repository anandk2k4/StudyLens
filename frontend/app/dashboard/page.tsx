// app/dashboard/page.tsx   ← move from app/page.tsx to app/dashboard/page.tsx
// The root "/" can be a landing page. Dashboard is now a protected route.
"use client";

import { Sidebar } from "@/components/sidebar/Sidebar";
import { Workspace } from "@/components/workspace/Workspace";

export default function DashboardPage() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Workspace />
      </main>
    </div>
  );
}