"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type OrderStats = { counts: Record<string, number>; revenue: number };
const EMPTY: OrderStats = { counts: {}, revenue: 0 };

// How many orders are in each status, and the revenue so far. Counts again when refresh is called.
export function useOrderStats() {
  const [stats, setStats] = useState<OrderStats>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    Promise.resolve(createClient().rpc("order_stats")).then(({ data }) => {
      if (data) setStats({ counts: data.counts ?? {}, revenue: Number(data.revenue ?? 0) });
      setLoaded(true);
    });
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const count = (status: string) => status === "all" ? Object.values(stats.counts).reduce((sum, n) => sum + n, 0) : stats.counts[status] ?? 0;
  return { stats, count, loaded, refresh };
}
