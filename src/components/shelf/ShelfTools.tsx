"use client";

import { useId, useState, type ReactNode } from "react";
import { Select } from "@/components/dropdown";
import { SORTS, type Query } from "@/lib/product-query";
import { PriceFields } from "./PriceFields";
import { ShelfSearchField } from "./ShelfSearchField";

// The row above the products: search box, shelf or type choice, sort, price range and stock filter.
export function ShelfTools({ query, searching, idle, choice, filtered, summary, onUpdate, onClear }: {
  query: Query;
  searching: boolean;
  idle: boolean;
  choice: ReactNode;
  filtered: boolean;
  summary: string;
  onUpdate: (patch: Partial<Query>) => void;
  onClear: () => void;
}) {
  // On a phone the price and stock filters sit behind a Filters button, to keep the products near the top.
  const extraId = useId();
  const [extrasOpen, setExtrasOpen] = useState(false);
  const extraCount = (query.min !== null || query.max !== null ? 1 : 0) + (query.inStock ? 1 : 0);

  return <div className="shelf-tools">
    {searching && <ShelfSearchField value={query.text} onChange={text => onUpdate({ text })} />}
    {!idle && <>
      <div className="shelf-tools-main">
        {choice}
        <div className="shelf-tools-side">
          <button type="button" className="shelf-filter-toggle" aria-expanded={extrasOpen} aria-controls={extraId} onClick={() => setExtrasOpen(open => !open)}>Filters{extraCount > 0 && <b>{extraCount}</b>}</button>
          <label className="shelf-control">Sort by
            <Select variant="pill" value={query.sort} options={SORTS.map(item => ({ value: item.value, label: item.label }))} onChange={next => onUpdate({ sort: next as Query["sort"] })} />
          </label>
        </div>
      </div>
      <div id={extraId} className={`shelf-tools-extra ${extrasOpen ? "is-open" : ""}`}>
        <PriceFields min={query.min} max={query.max} onChange={(min, max) => onUpdate({ min, max })} />
        <label className="shelf-check"><input type="checkbox" checked={query.inStock} onChange={event => onUpdate({ inStock: event.target.checked })} />In stock only</label>
        {filtered && <button type="button" className="shelf-clear" onClick={onClear}>Clear filters</button>}
        <p className="shelf-count" role="status">{summary}</p>
      </div>
    </>}
  </div>;
}
