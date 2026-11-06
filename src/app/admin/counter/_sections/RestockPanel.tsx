"use client";

import { useState } from "react";

const actions = [
  { title: "Upload inventory", text: "Add or update every item from one Excel or CSV file." },
  { title: "Download template", text: "Get the Excel file with the right columns to fill in." },
  { title: "Add stock to one item", text: "New boxes arrived? Pick the item and type how many." },
  { title: "Stock history", text: "See every sale, refill bottle, import and correction." },
];

// Receiving stock. These buttons are not connected yet in this mock.
export function RestockPanel() {
  const [shown, setShown] = useState("");
  return <div className="ct-restock">
    <div className="ct-actions">
      {actions.map(action => <button key={action.title} className="ct-action" onClick={() => setShown(`${action.title} is not built yet. This is how it would be reached.`)}>
        <strong>{action.title}</strong>
        <span>{action.text}</span>
      </button>)}
    </div>
    <p className="ct-note" role="status">{shown}</p>
  </div>;
}
