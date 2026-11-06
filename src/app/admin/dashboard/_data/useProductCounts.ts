"use client";

import { useCallback, useEffect, useState } from "react";
import { shelves, type Category } from "@/app/products";
import { createClient } from "@/utils/supabase/client";

export type ShelfFilter = Category | "all";
export type ProductCounts = Partial<Record<ShelfFilter, number>>;

async function loadProductCounts(): Promise<ProductCounts> {
  const supabase = createClient();
  const results = await Promise.all(shelves.map(shelf => supabase.from("products").select("id", { count: "exact", head: true }).eq("category", shelf.category)));
  const counts: ProductCounts = {};
  shelves.forEach((shelf, index) => { counts[shelf.category] = results[index].count ?? 0; });
  counts.all = results.reduce((sum, result) => sum + (result.count ?? 0), 0);
  return counts;
}

// How many products each shelf holds, with a way to count again after a change.
export function useProductCounts() {
  const [counts, setCounts] = useState<ProductCounts>({});
  const refresh = useCallback(() => { loadProductCounts().then(setCounts); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { counts, refresh };
}
