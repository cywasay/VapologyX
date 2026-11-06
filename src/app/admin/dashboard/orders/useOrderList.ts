"use client";

import { useEffect, useState } from "react";
import type { OrderLine, OrderStatus } from "@/lib/orders";
import { createClient } from "@/utils/supabase/client";

export const ORDERS_PAGE_SIZE = 25;

// An order as the admin reads it from the database.
export type AdminOrder = {
  id: string;
  number: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: "delivery" | "pickup";
  address: string;
  city: string;
  notes: string;
  payment: "cod" | "transfer";
  lines: OrderLine[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
};

type Results = { items: AdminOrder[]; total: number };

// Characters that would change the meaning of a search are dropped.
const cleanSearch = (text: string) => text.replace(/[*%_\\"(),]/g, " ").replace(/\s+/g, " ").trim();

// The admin's order list: newest first, narrowed by status and a search, a page at a time.
export function useOrderList(status: string, refreshKey: number) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(cleanSearch(search));
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let stale = false;
    let request = createClient().from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(page * ORDERS_PAGE_SIZE, page * ORDERS_PAGE_SIZE + ORDERS_PAGE_SIZE - 1);
    if (status !== "all") request = request.eq("status", status);
    if (query) request = request.or(`number.ilike."*${query}*",customer_name.ilike."*${query}*",customer_phone.ilike."*${query}*"`);
    Promise.resolve(request).then(({ data, count, error }) => {
      if (stale) return;
      setFailed(Boolean(error));
      if (!error) setResults({ items: (data ?? []) as AdminOrder[], total: count ?? 0 });
    });
    return () => { stale = true; };
  }, [status, query, page, refreshKey]);

  return { search, setSearch, query, page, setPage, results, failed };
}
