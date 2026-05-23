"use client";

import { Sidebar } from "@/components/sidebar/Sidebar";
import { Workspace } from "@/components/workspace/Workspace";

export default function Home() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Workspace />
      </main>
    </div>
  );
}