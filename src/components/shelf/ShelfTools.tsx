"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Select } from "@/components/dropdown";
import { usePhoneLayout } from "@/lib/phone-layout";
import { SORTS, type Query } from "@/lib/product-query";
import { money, shelfOf } from "@/lib/products";
import { PriceFields } from "./PriceFields";
import { ShelfSearchField } from "./ShelfSearchField";

// The row above the products: search box, shelf or type choice, sort, price range and stock filter.
export function ShelfTools({ query, searching, idle, choice, deviceName, filtered, summary, onUpdate, onClear }: {
  query: Query;
  searching: boolean;
  idle: boolean;
  choice: ReactNode;
  deviceName?: string;
  filtered: boolean;
  summary: string;
  onUpdate: (patch: Partial<Query>) => void;
  onClear: () => void;
}) {
  // On a phone the price and stock filters sit behind a Filters button, to keep the products near the top.
  const extraId = useId();
  const phone = usePhoneLayout();
  const toggle = useRef<HTMLButtonElement>(null);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const extraCount = (query.min !== null || query.max !== null ? 1 : 0) + (query.inStock ? 1 : 0);

  return <div className="shelf-tools">
    {searching && <ShelfSearchField value={query.text} onChange={text => onUpdate({ text })} />}
    {!idle && <>
      <div className="shelf-tools-main">
        {choice}
        <div className="shelf-tools-side">
          <button ref={toggle} type="button" className="shelf-filter-toggle" aria-expanded={extrasOpen} aria-controls={extraId} onClick={() => setExtrasOpen(open => !open)}>Filters{extraCount > 0 && <b>{extraCount}</b>}</button>
          <label className="shelf-control">Sort by
            <Select variant="pill" value={query.sort} options={SORTS.map(item => ({ value: item.value, label: item.label }))} onChange={next => onUpdate({ sort: next as Query["sort"] })} />
          </label>
        </div>
      </div>
      <div className={`shelf-tools-extra ${extrasOpen ? "is-open" : ""}`}>
        <div id={extraId} className="shelf-filter-fields" inert={phone && !extrasOpen} onKeyDown={event => {
          if (phone && event.key === "Escape") {
            setExtrasOpen(false);
            toggle.current?.focus();
          }
        }}>
          <PriceFields min={query.min} max={query.max} onChange={(min, max) => onUpdate({ min, max })} />
          <label className="shelf-check"><input type="checkbox" checked={query.inStock} onChange={event => onUpdate({ inStock: event.target.checked })} />In stock only</label>
          {filtered && <button type="button" className="shelf-clear" onClick={onClear}>Clear filters</button>}
        </div>
        {phone && filtered && <ActiveFilters query={query} deviceName={deviceName} onRemove={patch => {
          onUpdate(patch);
          toggle.current?.focus();
        }} />}
        <p className="shelf-count" role="status">{summary}</p>
      </div>
    </>}
  </div>;
}

function ActiveFilters({ query, deviceName, onRemove }: { query: Query; deviceName?: string; onRemove: (patch: Partial<Query>) => void }) {
  const chips: { label: string; reset: Partial<Query> }[] = [];
  if (query.shelf) chips.push({ label: shelfOf(query.shelf).name, reset: { shelf: "" } });
  if (query.type) chips.push({ label: query.type, reset: { type: "" } });
  if (query.fits) chips.push({ label: deviceName ? `Fits ${deviceName}` : "Device compatibility", reset: { fits: "" } });
  if (query.min !== null) chips.push({ label: `Min ${money(query.min)}`, reset: { min: null } });
  if (query.max !== null) chips.push({ label: `Max ${money(query.max)}`, reset: { max: null } });
  if (query.inStock) chips.push({ label: "In stock only", reset: { inStock: false } });
  const sort = SORTS.find(option => option.value === query.sort && option.value !== "featured");
  if (sort) chips.push({ label: sort.label, reset: { sort: "featured" } });

  return <ul className="phone-only shelf-filter-chips" aria-label="Active filters">
    {chips.map(({ label, reset }) => <li key={Object.keys(reset)[0]}>
      <button type="button" aria-label={`Remove filter: ${label}`} onClick={() => onRemove(reset)}>{label} <span aria-hidden="true">×</span></button>
    </li>)}
  </ul>;
}
