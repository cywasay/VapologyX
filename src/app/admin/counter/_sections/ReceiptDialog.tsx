"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND, money } from "@/lib/products";
import type { Sale } from "../types";

// A simple slip for the customer, shown after a sale or opened again from the sales list.
export function ReceiptDialog({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);

  return <dialog ref={dialog} className="ct-receipt" aria-labelledby="ct-receipt-title" onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="ct-slip">
      <h2 id="ct-receipt-title">{BRAND}</h2>
      <p className="ct-slip-sub">Sale #{sale.number} · {sale.time}{sale.voided ? " · VOIDED" : ""}</p>
      <ul>
        {sale.lines.map(line => <li key={line.itemId}><span>{line.quantity} × {line.name}</span><b>{money(line.price * line.quantity)}</b></li>)}
      </ul>
      <div className="ct-slip-total"><span>Total</span><b>{money(sale.total)}</b></div>
      <p className="ct-slip-sub">Paid by {sale.pay}{sale.given ? ` · Cash ${money(sale.given)} · Change ${money(sale.given - sale.total)}` : ""}</p>
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
