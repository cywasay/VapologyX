"use client";

import { useRef, useState, type ReactNode } from "react";
import { AccountProvider } from "../../_shared/account";
import { LogoutDialog } from "./LogoutDialog";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

// The frame around every dashboard page: sidebar, top bar and the log-out question.
export function DashboardShell({ children }: { children: ReactNode }) {
  const [minimized, setMinimized] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const logoutDialog = useRef<HTMLDialogElement>(null);

  return <AccountProvider>
    <div className={`admin ${minimized ? "is-minimized" : ""} ${drawerOpen ? "is-open" : ""}`}>
      <button className="admin-backdrop" aria-label="Close menu" tabIndex={drawerOpen ? 0 : -1} onClick={() => setDrawerOpen(false)} />
      <Sidebar minimized={minimized} onToggle={() => setMinimized(!minimized)} onNavigate={() => setDrawerOpen(false)} onLogout={() => logoutDialog.current?.showModal()} />
      <main className="admin-main">
        <Topbar drawerOpen={drawerOpen} onOpenMenu={() => setDrawerOpen(true)} />
        {children}
      </main>
      <LogoutDialog dialog={logoutDialog} />
    </div>
  </AccountProvider>;
}
