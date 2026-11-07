"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

export type StatDay = { day: string; counter: number; counterCount: number; online: number; onlineCount: number; refills: number; expenses: number };
export type DashboardStats = { days: StatDay[]; lowStock: number; soldOut: number };
type State = { stats: DashboardStats | null; failed: boolean };

const Context = createContext<State>({ stats: null, failed: false });

// Loads the overview's numbers once, so every card and the chart read the same answer from one request.
export function DashboardStatsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ stats: null, failed: false });
  useEffect(() => {
    let stale = false;
    Promise.resolve(createClient().rpc("dashboard_stats")).then(({ data, error }) => {
      if (stale) return;
      setState(error || !data ? { stats: null, failed: true } : { stats: data as DashboardStats, failed: false });
    });
    return () => { stale = true; };
  }, []);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}

export const useDashboardStats = () => useContext(Context);

// Today is the last of the seven days, and yesterday is the one before it.
export function todayAndYesterday(stats: DashboardStats | null) {
  const days = stats?.days ?? [];
  return { today: days.at(-1) ?? null, yesterday: days.at(-2) ?? null };
}
