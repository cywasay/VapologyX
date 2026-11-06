"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { SearchGlyph } from "./art";
import { ProductGrid } from "./product-lists";
import { DEFAULT_QUERY, SORTS, fetchProducts, limitQuery, readQuery, whole, writeQuery, type Query } from "./product-query";
import { shelves, type Category, type Product, type ProductPage } from "./products";
import { categories } from "./site-blocks";

type Option = { value: string; label: string };
type Loaded = ProductPage & { key: string };

// How long to wait after typing stops before the results change.
const PRICE_WAIT = 450;
const TEXT_WAIT = 350;

// The first page of a shelf, shown by the server before the browser takes over. The real filters appear in its place.
export function ShelfFallback({ initial }: { initial?: ProductPage }) {
  return <>
    <div className="shelf-tools is-placeholder" aria-hidden="true" />
    {initial ? <ProductGrid items={initial.items} /> : <div className="skeleton skeleton-panel" aria-hidden="true" />}
  </>;
}

// Finds the products for a query. The first page of the default view comes from the server; everything else is fetched here.
function useResults(scope: Category | null, key: string, initial: ProductPage | undefined, idle: boolean) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [moreFailedKey, setMoreFailedKey] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // What `loaded` holds, so that coming back to a page doesn't fetch it again and lose the pages already loaded.
  const loadedKey = useRef<string | null>(null);
  const latestKey = useRef(key);
  useEffect(() => { latestKey.current = key; });

  const fromServer = key === "" && initial !== undefined;
  const current: ProductPage | null = loaded?.key === key ? loaded : fromServer ? initial : null;
  const page = current ?? loaded ?? initial ?? null;

  useEffect(() => {
    if (idle || fromServer || loadedKey.current === key) return;
    let stale = false;
    fetchProducts(scope, key, 0).then(
      result => {
        if (stale) return;
        loadedKey.current = key;
        setLoaded({ ...result, key });
        setFailedKey(null);
      },
      () => { if (!stale) setFailedKey(key); },
    );
    return () => { stale = true; };
  }, [scope, key, idle, fromServer, attempt]);

  async function loadMore() {
    if (!current || loadingMore) return;
    setLoadingMore(true);
    setMoreFailedKey(null);
    try {
      const next = await fetchProducts(scope, key, current.items.length);
      if (latestKey.current === key) {
        const items = [...new Map([...current.items, ...next.items].map(item => [item.id, item])).values()];
        loadedKey.current = key;
        setLoaded({ items, total: next.total, key });
      }
    } catch {
      setMoreFailedKey(key);
    }
    setLoadingMore(false);
  }

  return {
    page,
    // True while the products shown belong to the previous filters and the new ones are on their way.
    stale: !idle && current === null && page !== null,
    failed: !idle && current === null && failedKey === key,
    moreFailed: moreFailedKey === key,
    loadingMore,
    loadMore,
    retry: () => { setFailedKey(null); setAttempt(count => count + 1); },
  };
}

function Choice({ label, options, value, onChange }: { label: string; options: Option[]; value: string; onChange: (value: string) => void }) {
  if (options.length > 8) {
    return <label className="shelf-control">{label}
      <select value={value} onChange={event => onChange(event.target.value)}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>;
  }
  return <div className="tabs" role="group" aria-label={label}>
    {options.map(option => <button key={option.value} type="button" className={value === option.value ? "is-active" : ""} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
  </div>;
}

const asText = (value: number | null) => value === null ? "" : String(value);

// Two boxes for the lowest and highest price. The results follow once typing stops.
function PriceFields({ min, max, onChange }: { min: number | null; max: number | null; onChange: (min: number | null, max: number | null) => void }) {
  const shown = `${asText(min)}|${asText(max)}`;
  const [seen, setSeen] = useState(shown);
  const [draft, setDraft] = useState({ min: asText(min), max: asText(max) });
  // When the address changes on its own (Clear filters, Back), the boxes follow it.
  if (seen !== shown) {
    setSeen(shown);
    setDraft({ min: asText(min), max: asText(max) });
  }
  const latest = useRef(onChange);
  useEffect(() => { latest.current = onChange; });

  useEffect(() => {
    const nextMin = whole(draft.min);
    const nextMax = whole(draft.max);
    if (nextMin === min && nextMax === max) return;
    const timer = setTimeout(() => latest.current(nextMin, nextMax), PRICE_WAIT);
    return () => clearTimeout(timer);
  }, [draft, min, max]);

  return <fieldset className="shelf-price">
    <legend className="sr-only">Price in rupees</legend>
    <span aria-hidden="true">Price Rs</span>
    <input inputMode="numeric" placeholder="Min" aria-label="Lowest price in rupees" value={draft.min} onChange={event => setDraft({ ...draft, min: event.target.value })} />
    <span aria-hidden="true">to</span>
    <input inputMode="numeric" placeholder="Max" aria-label="Highest price in rupees" value={draft.max} onChange={event => setDraft({ ...draft, max: event.target.value })} />
  </fieldset>;
}

// The search box of the search page. Results follow once typing stops, or at once on Enter.
function SearchField({ value, onChange }: { value: string; onChange: (text: string) => void }) {
  const [seen, setSeen] = useState(value);
  const [draft, setDraft] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(value);
  }
  const latest = useRef(onChange);
  useEffect(() => { latest.current = onChange; });
  const clean = (text: string) => text.replace(/\s+/g, " ").trim();

  useEffect(() => {
    const next = clean(draft);
    if (next === value) return;
    const timer = setTimeout(() => latest.current(next), TEXT_WAIT);
    return () => clearTimeout(timer);
  }, [draft, value]);

  return <form className="search-field" role="search" onSubmit={event => { event.preventDefault(); onChange(clean(draft)); }}>
    <SearchGlyph />
    <input type="search" value={draft} placeholder="Search devices, bottles, coils" aria-label="Search products" autoComplete="off" enterKeyHint="search" maxLength={80} autoFocus={!value} onChange={event => setDraft(event.target.value)} />
  </form>;
}

function ShelfLinks() {
  return <div className="menu-tiles flow-shelves">
    {categories.map(item => <Link key={item.href} href={item.href}>{item.art}<span>{item.name}</span></Link>)}
  </div>;
}

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
  const { page, stale, failed, moreFailed, loadingMore, loadMore, retry } = useResults(scope, key, initial, idle);
  // Anything other than the words themselves counts as a filter.
  const filtered = writeQuery({ ...query, text: "" }) !== "";
  // On a phone the price and stock filters sit behind a Filters button, to keep the products near the top.
  const extraId = useId();
  const [extrasOpen, setExtrasOpen] = useState(false);
  const extraCount = (query.min !== null || query.max !== null ? 1 : 0) + (query.inStock ? 1 : 0);

  // The address is changed without a trip to the server. The page reads it again and fetches the new results.
  function update(patch: Partial<Query>) {
    const next = writeQuery(limitQuery({ ...query, ...patch }, searching));
    window.history.replaceState(null, "", next ? `?${next}` : window.location.pathname);
  }
  const clear = () => update({ ...DEFAULT_QUERY, text: query.text });

  let choice: ReactNode = null;
  if (searching) {
    choice = <Choice label="Shelf" options={[{ value: "", label: "All shelves" }, ...shelves.map(item => ({ value: item.category, label: item.name }))]} value={query.shelf} onChange={value => update({ shelf: value as Category | "" })} />;
  } else if (category === "coil" && devices.length > 0) {
    choice = <Choice label="Fits" options={[{ value: "", label: "All devices" }, ...devices.map(device => ({ value: device.id, label: device.name }))]} value={query.fits} onChange={value => update({ fits: value })} />;
  } else if (types.length > 1) {
    choice = <Choice label={typeLabel} options={[{ value: "", label: "All" }, ...types.map(value => ({ value, label: value }))]} value={query.type} onChange={value => update({ type: value })} />;
  }

  const metaFor = category === "coil" && devices.length > 0
    ? (item: Product) => {
      const names = devices.filter(device => item.fits.includes(device.id)).map(device => device.name);
      return names.length ? `Fits ${names.join(", ")}` : undefined;
    }
    : undefined;

  let body: ReactNode;
  if (idle) {
    body = <div className="shelf-empty"><p>Type a name above, or pick a shelf.</p><ShelfLinks /></div>;
  } else if (failed) {
    body = <div className="shelf-empty"><p role="alert">We couldn&apos;t load these products.</p><button type="button" className="button button-primary" onClick={retry}>Try again</button></div>;
  } else if (!page) {
    body = <><div className="skeleton skeleton-panel" aria-hidden="true" /><p className="sr-only" role="status">Loading…</p></>;
  } else if (page.items.length === 0 && !stale) {
    body = <div className="shelf-empty">
      <p>{searching ? `Nothing matches “${query.text}”${filtered ? " with these filters" : ""}.` : filtered ? "No products match these filters." : emptyText}</p>
      {filtered && <button type="button" className="button button-primary" onClick={clear}>Clear filters</button>}
      {searching && <ShelfLinks />}
    </div>;
  } else {
    body = <>
      <div className={`shelf-results ${stale ? "is-busy" : ""}`} aria-busy={stale}>
        <ProductGrid items={page.items} metaFor={metaFor} />
      </div>
      {page.items.length < page.total && <div className="shelf-more">
        <span>Showing {page.items.length} of {page.total}</span>
        <button type="button" className="button button-primary" disabled={loadingMore || stale} onClick={loadMore}>{loadingMore ? "Loading…" : "Load more"}</button>
      </div>}
      {moreFailed && <p className="shelf-message" role="alert">We couldn&apos;t load more products. Please try again.</p>}
    </>;
  }

  const summary = idle || !page ? "" : stale ? "Updating…" : `${page.total} ${page.total === 1 ? "product" : "products"}`;

  return <>
    <div className="shelf-tools">
      {searching && <SearchField value={query.text} onChange={text => update({ text })} />}
      {!idle && <>
        <div className="shelf-tools-main">
          {choice}
          <div className="shelf-tools-side">
            <button type="button" className="shelf-filter-toggle" aria-expanded={extrasOpen} aria-controls={extraId} onClick={() => setExtrasOpen(open => !open)}>Filters{extraCount > 0 && <b>{extraCount}</b>}</button>
            <label className="shelf-control">Sort by
              <select value={query.sort} onChange={event => update({ sort: event.target.value as Query["sort"] })}>
                {SORTS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div id={extraId} className={`shelf-tools-extra ${extrasOpen ? "is-open" : ""}`}>
          <PriceFields min={query.min} max={query.max} onChange={(min, max) => update({ min, max })} />
          <label className="shelf-check"><input type="checkbox" checked={query.inStock} onChange={event => update({ inStock: event.target.checked })} />In stock only</label>
          {filtered && <button type="button" className="shelf-clear" onClick={clear}>Clear filters</button>}
          <p className="shelf-count" role="status">{summary}</p>
        </div>
      </>}
    </div>
    {body}
  </>;
}
