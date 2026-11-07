import Link from "next/link";
import { money } from "@/lib/products";
import { Icon } from "../../_shared/Icon";
import type { Counter } from "../useCounter";
import type { Mode } from "../types";

const modes: { id: Mode; label: string }[] = [
  { id: "sell", label: "Sell" },
  { id: "refill", label: "Refill" },
  { id: "sales", label: "Sales" },
  { id: "closing", label: "Closing" },
  { id: "restock", label: "Restock" },
];

// The strip across the top: the big mode buttons, today's running totals and the way back to the admin.
const Sun = () => <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></svg>;
const Moon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8 8 0 1 1 9.4 4a6.4 6.4 0 0 0 10.6 10.6Z" /></svg>;
const Expand = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>;
const Shrink = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>;

export function CounterTopBar({ mode, onMode, counter, dark, onDark, full, onFull }: { mode: Mode; onMode: (mode: Mode) => void; counter: Counter; dark: boolean; onDark: () => void; full: boolean | null; onFull: () => void }) {
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
    <div className="ct-tools">
      <button className="ct-icon" onClick={onDark} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}>{dark ? <Sun /> : <Moon />}</button>
      {full !== null && <button className="ct-icon" onClick={onFull} aria-label={full ? "Leave full screen" : "Full screen"} title={full ? "Leave full screen" : "Full screen"}>{full ? <Shrink /> : <Expand />}</button>}
    </div>
  </header>;
}
