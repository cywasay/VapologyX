import Link from "next/link";
import { money } from "@/lib/products";
import { Icon } from "../../_shared/Icon";
import type { Counter } from "../useCounter";
import type { Mode } from "../types";

const modes: { id: Mode; label: string }[] = [
  { id: "sell", label: "Sell" },
  { id: "refill", label: "Refill" },
  { id: "restock", label: "Restock" },
];

// The strip across the top: the big mode buttons, today's running totals and the way back to the admin.
export function CounterTopBar({ mode, onMode, counter }: { mode: Mode; onMode: (mode: Mode) => void; counter: Counter }) {
  return <header className="ct-top">
    <Link href="/admin/dashboard" className="ct-exit" aria-label="Back to the admin"><Icon name="chevron" /><span>Admin</span></Link>
    <div className="ct-modes" role="group" aria-label="Counter mode">
      {modes.map(item => <button key={item.id} className={mode === item.id ? "is-current" : ""} aria-pressed={mode === item.id} onClick={() => onMode(item.id)}>{item.label}</button>)}
    </div>
    <dl className="ct-totals">
      <div><dt>Sales today</dt><dd>{money(counter.salesToday.total)}</dd><small>{counter.salesToday.count} sales</small></div>
      <div><dt>Refills today</dt><dd>{money(counter.refillsToday)}</dd></div>
      <div className="is-lime"><dt>Earned from refills</dt><dd>{money(counter.refillsAll)}</dd><small>all time</small></div>
    </dl>
  </header>;
}
