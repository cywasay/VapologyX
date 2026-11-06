"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { DEFAULT_QUERY, limitQuery, readQuery, writeQuery, type Query } from "@/lib/product-query";
import { shelves, type Category, type Product, type ProductPage } from "@/lib/products";
import { ShelfBody } from "./ShelfBody";
import { ShelfChoice } from "./ShelfChoice";
import { ShelfTools } from "./ShelfTools";
import { useShelfResults } from "./useShelfResults";

// Shows one shelf (or, with category null, the whole shop for a search) with its filters.
// What the visitor picked is kept in the page address, so a link, a reload or the Back button brings it back.
export function ShelfBrowser({ category, initial, types = [], typeLabel = "Type", devices = [], emptyText = "No products here yet." }: {
  category: Category | null;
  initial?: ProductPage;
  types?: string[];
  typeLabel?: string;
  devices?: { id: string; name: string }[];
  emptyText?: string;
}) {
  const searching = category === null;
  const query = limitQuery(readQuery(useSearchParams()), searching);
  const key = writeQuery(query);
  const scope = searching ? query.shelf || null : category;
  const idle = searching && query.text === "";
  const results = useShelfResults(scope, key, initial, idle);
  const { page, stale } = results;
  // Anything other than the words themselves counts as a filter.
  const filtered = writeQuery({ ...query, text: "" }) !== "";

  // The address is changed without a trip to the server. The page reads it again and fetches the new results.
  function update(patch: Partial<Query>) {
    const next = writeQuery(limitQuery({ ...query, ...patch }, searching));
    window.history.replaceState(null, "", next ? `?${next}` : window.location.pathname);
  }
  const clear = () => update({ ...DEFAULT_QUERY, text: query.text });

  let choice: ReactNode = null;
  if (searching) {
    choice = <ShelfChoice label="Shelf" options={[{ value: "", label: "All shelves" }, ...shelves.map(item => ({ value: item.category, label: item.name }))]} value={query.shelf} onChange={value => update({ shelf: value as Category | "" })} />;
  } else if (category === "coil" && devices.length > 0) {
    choice = <ShelfChoice label="Fits" options={[{ value: "", label: "All devices" }, ...devices.map(device => ({ value: device.id, label: device.name }))]} value={query.fits} onChange={value => update({ fits: value })} />;
  } else if (types.length > 1) {
    choice = <ShelfChoice label={typeLabel} options={[{ value: "", label: "All" }, ...types.map(value => ({ value, label: value }))]} value={query.type} onChange={value => update({ type: value })} />;
  }

  const metaFor = category === "coil" && devices.length > 0
    ? (item: Product) => {
      const names = devices.filter(device => item.fits.includes(device.id)).map(device => device.name);
      return names.length ? `Fits ${names.join(", ")}` : undefined;
    }
    : undefined;

  const summary = idle || !page ? "" : stale ? "Updating…" : `${page.total} ${page.total === 1 ? "product" : "products"}`;

  return <>
    <ShelfTools query={query} searching={searching} idle={idle} choice={choice} filtered={filtered} summary={summary} onUpdate={update} onClear={clear} />
    <ShelfBody results={results} idle={idle} searching={searching} text={query.text} filtered={filtered} emptyText={emptyText} metaFor={metaFor} onClear={clear} />
  </>;
}
