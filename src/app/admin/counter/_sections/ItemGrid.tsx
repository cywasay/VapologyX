"use client";

import { useState } from "react";
import { ProductArt } from "@/components/art";
import { LIME, money, shelves } from "@/lib/products";
import type { Counter } from "../useCounter";
import type { Shelf } from "../types";

const tabs: { id: Shelf | "all"; label: string }[] = [{ id: "all", label: "All" }, ...shelves.map(shelf => ({ id: shelf.category, label: shelf.name }))];

// The shelf tabs, the search box and one tile per item. Tapping a tile adds it to the sale.
// A barcode scanner types its code into the search box and presses Enter, which adds that item.
export function ItemGrid({ counter, shelf, onShelf, search, onSearch }: { counter: Counter; shelf: Shelf | "all"; onShelf: (shelf: Shelf | "all") => void; search: string; onSearch: (text: string) => void }) {
  const [scanned, setScanned] = useState("");
  const text = search.trim().toLowerCase();
  const shown = counter.items.filter(item => (shelf === "all" || item.shelf === shelf) && (item.name.toLowerCase().includes(text) || item.code.includes(text)));
  // Two products can share a name on different shelves (a coil and a device), so those tiles also say which shelf they are on.
  const sharedNames = new Set(counter.items.filter((item, index) => counter.items.findIndex(other => other.name === item.name) !== index).map(item => item.name));
  const inSale = (id: string) => counter.lines.find(line => line.item.id === id)?.quantity ?? 0;

  function enter() {
    if (!text) return;
    const result = counter.scan(text);
    if (result === null) {
      if (/^\d{5,}$/.test(text)) setScanned(`No item has the code ${text}.`);
      return;
    }
    setScanned(result);
    onSearch("");
  }

  return <div className="ct-items">
    <div className="ct-tabs" role="group" aria-label="Shelf">
      {tabs.map(tab => <button key={tab.id} className={shelf === tab.id ? "is-current" : ""} aria-pressed={shelf === tab.id} onClick={() => onShelf(tab.id)}>{tab.label}</button>)}
    </div>
    <input className="ct-search" type="search" placeholder="Search, or scan a barcode" aria-label="Search items or scan a barcode" value={search} onChange={event => { onSearch(event.target.value); setScanned(""); }} onKeyDown={event => { if (event.key === "Enter") enter(); }} />
    {scanned && <p className="ct-note" role="status">{scanned}</p>}
    <div className="ct-grid">
      {shown.map(item => {
        const left = item.stock - inSale(item.id);
        return <button key={item.id} className={`ct-item ${left <= 0 ? "is-out" : ""}`} onClick={() => counter.add(item.id)} disabled={left <= 0}>
          <span className="ct-item-art"><ProductArt item={{ name: item.name, category: item.shelf, type: item.type, color: LIME, image_url: null }} sizes="96px" /></span>
          <strong>{item.name}</strong>
          {sharedNames.has(item.name) && <small>{shelves.find(entry => entry.category === item.shelf)?.singular}</small>}
          <span>{money(item.price)}</span>
          <em>{left <= 0 ? "Sold out" : left <= 2 ? `Only ${left} left` : `${left} in stock`}</em>
          {inSale(item.id) > 0 && <b className="ct-badge">{inSale(item.id)}</b>}
        </button>;
      })}
      {shown.length === 0 && <p className="ct-empty">No items match.</p>}
    </div>
  </div>;
}
