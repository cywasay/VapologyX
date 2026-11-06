"use client";

import { useState } from "react";
import { Select } from "@/components/dropdown";
import type { Counter } from "../useCounter";

// Opens a new bottle for refills. The bottle comes off the stock, so it can't be sold as a whole bottle any more.
export function OpenBottleBar({ counter }: { counter: Counter }) {
  const bottles = counter.items.filter(item => item.shelf === "bottle");
  const [picked, setPicked] = useState("");
  const chosen = bottles.find(item => item.id === picked) ?? bottles.find(item => item.stock > 0) ?? bottles[0];
  return <div className="ct-open-bar">
    <div>
      <h2>Open a bottle for refills</h2>
      <p>It comes off your stock and starts a refill record.</p>
    </div>
    <div className="ct-open-controls">
      <Select variant="pill" value={chosen?.id ?? ""} options={bottles.map(item => ({ value: item.id, label: `${item.name} (${item.stock} in stock)` }))} onChange={setPicked} aria-label="Flavor to open" />
      <button className="ct-primary" disabled={!chosen || chosen.stock < 1} onClick={() => chosen && counter.openBottle(chosen.id)}>Open bottle</button>
    </div>
  </div>;
}
