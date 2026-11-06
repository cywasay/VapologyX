import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardShell } from "./_shell/DashboardShell";

export const metadata: Metadata = { title: "Admin" };

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
