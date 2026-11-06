"use client";

import { useState } from "react";
import { money } from "@/lib/products";
import type { Counter } from "../useCounter";

// Every sale made today, newest first. A wrong sale can be voided, which puts its items back in stock.
export function SalesPanel({ counter }: { counter: Counter }) {
  const [confirming, setConfirming] = useState("");
  const rows = [...counter.sales].reverse();
  const voided = counter.sales.filter(sale => sale.voided).length;
  return <section className="ct-sales" aria-labelledby="ct-sales-title">
    <h2 id="ct-sales-title" className="ct-section-title">Sales today <small>{counter.salesToday.count} sales, {voided} voided</small></h2>
    <ul className="ct-sales-list">
      {rows.map(sale => <li key={sale.id} className={sale.voided ? "is-voided" : ""}>
        <span className="ct-sale-num">#{sale.number}<small>{sale.time}</small></span>
        <span className="ct-sale-items">{sale.lines.map(line => `${line.quantity} × ${line.name}`).join(", ")}</span>
        <span className="ct-sale-pay">{sale.pay}</span>
        <strong>{money(sale.total)}</strong>
        <span className="ct-sale-actions">
          <button className="ct-link" onClick={() => counter.openReceipt(sale)}>Receipt</button>
          {sale.voided
            ? <em>Voided</em>
            : confirming === sale.id
            ? <span className="ct-confirm">Void it? <button className="ct-link" onClick={() => { counter.voidSale(sale.id); setConfirming(""); }}>Yes, void</button><button className="ct-link" onClick={() => setConfirming("")}>Cancel</button></span>
            : <button className="ct-link" onClick={() => setConfirming(sale.id)}>Void</button>}
        </span>
      </li>)}
      {rows.length === 0 && <li className="ct-empty">No sales yet today.</li>}
    </ul>
  </section>;
}
