"use client";

import { useEffect, useState } from "react";
import { Loader } from "@/components/loader/Loader";
import { createClient } from "@/utils/supabase/client";

type Move = { id: number; product_name: string; change: number; stock_after: number; reason: string; note: string; created_at: string };

const REASONS: Record<string, string> = {
  import: "Import", sale: "Sale", void: "Sale voided", order: "Online order", order_cancel: "Order cancelled",
  restock: "Restock", refill: "Opened for refills", writeoff: "Removed", adjustment: "Edited",
};
const STEP = 50;
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// Every change to the stock, newest first, with the reason.
export function StockHistory({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(STEP);
  const [rows, setRows] = useState<Move[] | null>(null);
  const [total, setTotal] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setLimit(STEP); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let stale = false;
    let request = createClient().from("stock_moves").select("id,product_name,change,stock_after,reason,note,created_at", { count: "exact" })
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range(0, limit - 1);
    if (query) request = request.ilike("product_name", `%${query.replace(/[\\%_]/g, "\\$&")}%`);
    request.then(({ data, count, error }) => {
      if (stale) return;
      setFailed(Boolean(error));
      if (!error) { setRows((data ?? []) as Move[]); setTotal(count ?? 0); }
    });
    return () => { stale = true; };
  }, [query, limit]);

  return <section className="ct-card ct-history" aria-labelledby="ct-history-title">
    <div className="ct-back"><button type="button" className="ct-link" onClick={onBack}>← Restock</button></div>
    <h2 id="ct-history-title" className="ct-section-title">Stock history <small>{total} changes</small></h2>
    <input className="ct-history-search" placeholder="Search by product name" aria-label="Search stock history" value={search} onChange={event => setSearch(event.target.value)} />
    {failed && <p className="ct-diff is-off" role="alert">The history couldn&apos;t load. Please try again.</p>}
    {!failed && !rows && <Loader label="Loading history" size="small" />}
    {rows && rows.length === 0 && <p className="ct-empty">{query ? "No changes for that product." : "No stock changes yet."}</p>}
    {rows && rows.length > 0 && <div className="ct-history-table">
      <table>
        <thead><tr><th>When</th><th>Product</th><th>Change</th><th>Left</th><th>Reason</th></tr></thead>
        <tbody>{rows.map(move => <tr key={move.id}>
          <td>{when(move.created_at)}</td>
          <td>{move.product_name}</td>
          <td className={move.change > 0 ? "is-up" : "is-down"}>{move.change > 0 ? `+${move.change}` : move.change}</td>
          <td>{move.stock_after}</td>
          <td>{REASONS[move.reason] ?? move.reason}{move.note && <small>{move.note}</small>}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    {rows && rows.length < total && <button type="button" className="ct-primary" onClick={() => setLimit(current => current + STEP)}>Show more</button>}
  </section>;
}
