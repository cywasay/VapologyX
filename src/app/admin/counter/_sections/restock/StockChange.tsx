"use client";

import { useState, type FormEvent } from "react";
import { counterApi } from "../../counterApi";
import { ProductPicker, type PickedProduct } from "./ProductPicker";

const COPY = {
  add: { title: "Add stock", hint: "New boxes arrived? Pick the item and type how many.", button: "Add to stock", noteLabel: "Note (optional)", notePlaceholder: "Supplier or shipment" },
  remove: { title: "Remove stock", hint: "For stock that left without a sale: damaged, a sample, lost. It is counted as an expense.", button: "Remove from stock", noteLabel: "Why is it being removed?", notePlaceholder: "Damaged, sample, lost…" },
};

// One form for both directions: stock coming in, and stock going out without a sale.
export function StockChange({ mode, onChanged, onBack }: { mode: "add" | "remove"; onChanged: () => void; onBack: () => void }) {
  const copy = COPY[mode];
  const [picked, setPicked] = useState<PickedProduct | null>(null);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; failed: boolean } | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const amount = Number(quantity);
    if (!picked) return setMessage({ text: "Pick a product first.", failed: true });
    if (!Number.isInteger(amount) || amount < 1) return setMessage({ text: "Enter a whole number of 1 or more.", failed: true });
    if (mode === "remove" && !note.trim()) return setMessage({ text: "Please say why the stock is being removed.", failed: true });
    setBusy(true);
    const reply = mode === "add" ? await counterApi.restock(picked.id, amount, note) : await counterApi.writeOff(picked.id, amount, note);
    setBusy(false);
    if (!reply.ok) return setMessage({ text: reply.error, failed: true });
    setMessage({ text: `${picked.name}: ${mode === "add" ? "added" : "removed"} ${amount}. Now ${reply.data} in stock.`, failed: false });
    setPicked({ ...picked, stock: reply.data });
    setQuantity("");
    setNote("");
    onChanged();
  }

  return <section className="ct-card ct-stock-form" aria-labelledby="ct-stock-title">
    <div className="ct-back"><button type="button" className="ct-link" onClick={onBack}>← Restock</button></div>
    <h2 id="ct-stock-title" className="ct-section-title">{copy.title}</h2>
    <p className="ct-note">{copy.hint}</p>
    <form onSubmit={submit}>
      <ProductPicker picked={picked} onPick={product => { setPicked(product); setMessage(null); }} />
      <label className="ct-field">How many
        <input inputMode="numeric" value={quantity} onChange={event => setQuantity(event.target.value)} />
      </label>
      <label className="ct-field">{copy.noteLabel}
        <input value={note} maxLength={120} placeholder={copy.notePlaceholder} onChange={event => setNote(event.target.value)} />
      </label>
      <button type="submit" className="ct-primary" disabled={busy}>{busy ? "Saving…" : copy.button}</button>
    </form>
    {message && <p className={`ct-diff ${message.failed ? "is-off" : "is-ok"}`} role={message.failed ? "alert" : "status"}>{message.text}</p>}
  </section>;
}
