"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ProductArt } from "./art";
import { PAGE_SIZE, PRODUCT_COLUMNS, money, productHref, shelfOf, varietyPrice, type Category, type Product, type ProductPage, type Variety } from "./products";
import { useStore } from "./store-shell";
import { publicClient } from "../utils/supabase/public";

type Filter = { column: "type" | "fits"; value: string } | null;

async function fetchProducts(category: Category, filter: Filter, from: number): Promise<ProductPage> {
  let query = publicClient().from("products").select(PRODUCT_COLUMNS, { count: "exact" }).eq("category", category).order("position").range(from, from + PAGE_SIZE - 1);
  if (filter?.column === "type") query = query.eq("type", filter.value);
  if (filter?.column === "fits") query = query.contains("fits", [filter.value]);
  const { data, count, error } = await query;
  if (error) throw error;
  return { items: (data ?? []) as unknown as Product[], total: count ?? 0 };
}

// Starts from the page the server rendered, then fetches other filters and further pages on demand.
function useShelf(category: Category, initial: ProductPage, filter: Filter) {
  const filterKey = filter ? `${filter.column}:${filter.value}` : "";
  const [loaded, setLoaded] = useState<(ProductPage & { key: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!filter) return;
    let stale = false;
    fetchProducts(category, filter, 0).then(
      page => { if (!stale) { setLoaded({ ...page, key: filterKey }); setFailedKey(null); } },
      () => { if (!stale) setFailedKey(filterKey); },
    );
    return () => { stale = true; };
    // The key already captures the filter's column and value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, filterKey]);

  const page = loaded?.key === filterKey ? loaded : filter ? null : initial;

  async function loadMore() {
    if (!page) return;
    setBusy(true);
    try {
      const next = await fetchProducts(category, filter, page.items.length);
      setLoaded({ items: [...page.items, ...next.items], total: next.total, key: filterKey });
      setFailedKey(null);
    } catch {
      setFailedKey(filterKey);
    }
    setBusy(false);
  }

  return { page, busy, failed: failedKey === filterKey, loadMore };
}

function cardSummary(item: Product) {
  if (item.category === "device" || item.category === "coil") {
    const values = item.specs.slice(0, 2).map(spec => spec.value);
    if (values.length) return values.join(" / ");
  }
  return item.description;
}

export function ProductCard({ item, meta, style }: { item: Product; meta?: string; style?: CSSProperties }) {
  const { quantityOf, add, setFit } = useStore();
  const href = productHref(item);
  const quantity = quantityOf(item.id);
  const hasVarieties = item.variants.length > 0;
  return <article className="product" style={style}>
    <Link href={href} className="product-image" aria-label={`View ${item.name}`} tabIndex={-1}>
      {item.badge && <span className="badge">{item.badge}</span>}
      <ProductArt item={item} />
    </Link>
    <span className="product-meta">{meta ?? (item.type || shelfOf(item.category).singular)}</span>
    <h3><Link href={href}>{item.name}</Link></h3>
    <p className="product-specs">{cardSummary(item)}</p>
    {item.category === "device" && <Link className="text-link" href="/coils" onClick={() => setFit(item.id)}>View compatible coils</Link>}
    <div className="product-buy">
      <strong>{hasVarieties && "From "}{money(Math.min(item.price, ...item.variants.map(variety => variety.price ?? item.price)))}</strong>
      {hasVarieties
        ? <Link className="button button-add" href={href} aria-label={`Choose options for ${item.name}`}>Options</Link>
        : <button className="button button-add" onClick={() => add(item)} aria-label={`Add ${item.name} to cart`}>{quantity ? `In cart: ${quantity}` : "Add +"}</button>}
    </div>
  </article>;
}

export function ProductGrid({ items, metaFor }: { items: Product[]; metaFor?: (item: Product) => string | undefined }) {
  return <div className="product-grid">{items.map(item => <ProductCard key={item.id} item={item} meta={metaFor?.(item)} />)}</div>;
}

function FilterTabs({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (value: string) => void }) {
  return <div className="tabs" role="group" aria-label={label}>
    {options.map(option => <button key={option.value} className={value === option.value ? "is-active" : ""} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
  </div>;
}

function ShelfResults({ shelf, emptyText, metaFor }: { shelf: ReturnType<typeof useShelf>; emptyText: string; metaFor?: (item: Product) => string | undefined }) {
  const { page, busy, failed, loadMore } = shelf;
  if (failed && !page) return <p className="shelf-message">We couldn&apos;t load these products. Please refresh the page.</p>;
  if (!page) return <p className="shelf-message" role="status">Loading…</p>;
  if (page.items.length === 0) return <p className="shelf-message">{emptyText}</p>;
  return <>
    <ProductGrid items={page.items} metaFor={metaFor} />
    {page.items.length < page.total && <div className="shelf-more">
      <span>Showing {page.items.length} of {page.total}</span>
      <button className="button button-primary" disabled={busy} onClick={loadMore}>{busy ? "Loading…" : "Load more"}</button>
    </div>}
    {failed && <p className="shelf-message" role="alert">We couldn&apos;t load more products. Please try again.</p>}
  </>;
}

export function ShelfList({ category, initial, emptyText = "No products here yet." }: { category: Category; initial: ProductPage; emptyText?: string }) {
  const shelf = useShelf(category, initial, null);
  return <ShelfResults shelf={shelf} emptyText={emptyText} />;
}

export function BottleList({ initial, types }: { initial: ProductPage; types: string[] }) {
  const [type, setType] = useState("All");
  const shelf = useShelf("bottle", initial, type === "All" ? null : { column: "type", value: type });
  return <>
    {types.length > 1 && <FilterTabs label="Filter bottles" options={["All", ...types].map(value => ({ value, label: value }))} value={type} onChange={setType} />}
    <ShelfResults shelf={shelf} emptyText="No bottles here yet." />
  </>;
}

export function CoilList({ initial, devices }: { initial: ProductPage; devices: { id: string; name: string }[] }) {
  const { fit, setFit } = useStore();
  const shelf = useShelf("coil", initial, fit === "All" ? null : { column: "fits", value: fit });
  const options = [{ value: "All", label: "All devices" }, ...devices.map(device => ({ value: device.id, label: device.name }))];
  const fitsLabel = (item: Product) => {
    const names = devices.filter(device => item.fits.includes(device.id)).map(device => device.name);
    return names.length ? `Fits ${names.join(", ")}` : undefined;
  };
  return <>
    <FilterTabs label="Filter coils by device" options={options} value={fit} onChange={setFit} />
    <ShelfResults shelf={shelf} emptyText="No coils found for this device yet." metaFor={fitsLabel} />
  </>;
}

export function AddToCart({ item, variety }: { item: Product; variety: Variety | null }) {
  const { quantityOf, add } = useStore();
  const quantity = quantityOf(item.id);
  return <button className="button button-primary detail-add" onClick={() => add(item, variety)}>{quantity ? `In cart: ${quantity}. Add another` : `Add to cart · ${money(varietyPrice(item, variety))}`}</button>;
}
