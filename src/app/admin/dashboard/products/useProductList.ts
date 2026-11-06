"use client";

import { useEffect, useState } from "react";
import { PRODUCT_COLUMNS, type Product } from "@/lib/products";
import { createClient } from "@/utils/supabase/client";
import type { ShelfFilter } from "../_data/useProductCounts";

export const PAGE_SIZE = 25;
type Results = { items: Product[]; total: number };

// The admin's product list: one shelf (or all), narrowed by a name search, a page at a time.
export function useProductList(shelf: ShelfFilter, refreshKey: number) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [failed, setFailed] = useState(false);

  // The search runs a moment after typing stops.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let stale = false;
    let request = createClient().from("products").select(PRODUCT_COLUMNS, { count: "exact" }).order("position", { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (shelf !== "all") request = request.eq("category", shelf);
    // Treats % and _ typed in the search box as ordinary characters.
    if (query) request = request.ilike("name", `%${query.replace(/[\\%_]/g, "\\$&")}%`);
    request.then(({ data, count, error }) => {
      if (stale) return;
      setFailed(Boolean(error));
      if (!error) setResults({ items: (data ?? []) as unknown as Product[], total: count ?? 0 });
    });
    return () => { stale = true; };
  }, [shelf, query, page, refreshKey]);

  return { search, setSearch, query, page, setPage, results, failed };
}
