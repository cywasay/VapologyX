"use client";

import Link from "next/link";
import { useState } from "react";

const actions = [
  { title: "Add stock to one item", text: "New boxes arrived? Pick the item and type how many." },
  { title: "Stock history", text: "See every sale, refill bottle, import and correction." },
];

// Receiving stock. Uploading the inventory sheet is real; the other two are not built yet.
export function RestockPanel() {
  const [shown, setShown] = useState("");
  return <div className="ct-restock">
    <div className="ct-actions">
      <Link className="ct-action" href="/admin/dashboard/products/import">
        <strong>Upload inventory</strong>
        <span>Add or update every item from your Excel sheet. You see a preview before anything is saved.</span>
      </Link>
      {actions.map(action => <button key={action.title} className="ct-action" onClick={() => setShown(`${action.title} is not built yet.`)}>
        <strong>{action.title}</strong>
        <span>{action.text}</span>
      </button>)}
    </div>
    <p className="ct-note" role="status">{shown}</p>
  </div>;
}
