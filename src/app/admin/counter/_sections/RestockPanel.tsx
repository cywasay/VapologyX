"use client";

import Link from "next/link";
import { useState } from "react";
import { StockChange } from "./restock/StockChange";
import { StockHistory } from "./restock/StockHistory";

type View = "menu" | "add" | "remove" | "history";

const actions: { view: Exclude<View, "menu">; title: string; text: string }[] = [
  { view: "add", title: "Add stock to one item", text: "New boxes arrived? Pick the item and type how many." },
  { view: "remove", title: "Remove stock", text: "Damaged, a sample or lost? Take it off with a reason." },
  { view: "history", title: "Stock history", text: "See every sale, refill bottle, import and correction." },
];

// Receiving stock, taking it out for other reasons, and looking back at every change.
export function RestockPanel({ onChanged }: { onChanged: () => void }) {
  const [view, setView] = useState<View>("menu");
  const back = () => setView("menu");
  if (view === "add" || view === "remove") return <StockChange key={view} mode={view} onChanged={onChanged} onBack={back} />;
  if (view === "history") return <StockHistory onBack={back} />;
  return <div className="ct-restock">
    <div className="ct-actions">
      <Link className="ct-action" href="/admin/dashboard/products/import">
        <strong>Upload inventory</strong>
        <span>Add or update every item from your Excel sheet. You see a preview before anything is saved.</span>
      </Link>
      {actions.map(action => <button key={action.view} className="ct-action" onClick={() => setView(action.view)}>
        <strong>{action.title}</strong>
        <span>{action.text}</span>
      </button>)}
    </div>
  </div>;
}
