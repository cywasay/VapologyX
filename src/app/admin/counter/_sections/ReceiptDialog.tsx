"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND, money } from "@/lib/products";
import type { Sale } from "../types";

// A simple slip for the customer, shown after a sale or opened again from the sales list.
export function ReceiptDialog({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  // A discount is shown to the customer. Extra charged is not: the slip then shows each item at the amount actually paid.
  const saved = Math.max(0, sale.listTotal - sale.total);
  const scale = sale.total > sale.listTotal && sale.listTotal > 0 ? sale.total / sale.listTotal : 1;
  const linePrice = (amount: number) => Math.round(amount * scale);

  return <dialog ref={dialog} className="ct-receipt" aria-labelledby="ct-receipt-title" onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="ct-slip">
      <h2 id="ct-receipt-title">{BRAND}</h2>
      <p className="ct-slip-sub">Sale #{sale.number} · {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} {sale.time}{sale.voided ? " · VOIDED" : ""}</p>
      <ul>
        {sale.lines.map(line => <li key={line.itemId}><span>{line.quantity} × {line.name}</span><b>{money(linePrice(line.price * line.quantity))}</b></li>)}
      </ul>
      {saved > 0 && <div className="ct-slip-row"><span>Discount</span><b>−{money(saved)}</b></div>}
      <div className="ct-slip-total"><span>Total</span><b>{money(sale.total)}</b></div>
      {saved > 0 && <p className="ct-slip-saved">You saved {money(saved)}</p>}
      <p className="ct-slip-sub">Paid by {sale.pay}</p>
      <p className="ct-slip-sub">Thank you. Adults 18+ only.</p>
    </div>
    <div className="ct-receipt-actions">
      <button className="ct-primary" onClick={() => window.print()}>Print</button>
      <button onClick={() => setMessage("WhatsApp sending is not connected yet in this mock.")}>Send on WhatsApp</button>
      <button onClick={() => dialog.current?.close()}>Close</button>
    </div>
    <p className="ct-note" role="status">{message}</p>
  </dialog>;
}
