"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, Pills } from "./admin-ui";
import { ProductArt } from "./art";
import { PRODUCT_COLUMNS, money, productHref, shelfOf, shelves, type Category, type Product } from "./products";
import { createClient } from "../utils/supabase/client";

export type ShelfFilter = Category | "all";
export type ProductCounts = Partial<Record<ShelfFilter, number>>;

const PAGE_SIZE = 25;

type Results = { items: Product[]; total: number };

export function AdminProducts({ shelf, onShelfChange, counts, refreshKey, notice, onAdd, onEdit }: {
  shelf: ShelfFilter;
  onShelfChange: (shelf: ShelfFilter) => void;
  counts: ProductCounts;
  refreshKey: number;
  notice: string;
  onAdd: () => void;
  onEdit: (product: Product) => void;
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let stale = false;
    let request = createClient().from("products").select(PRODUCT_COLUMNS, { count: "exact" }).order("position", { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (shelf !== "all") request = request.eq("category", shelf);
    // Treats % and _ typed in the search box as ordinary characters.
    if (query) request = request.ilike("name", `%${query.replace(/[\\%_]/g, "\\$&")}%`);
    request.then(({ data, count, error }) => {
      if (stale) return;
      setFailed(Boolean(error));
      if (!error) setResults({ items: (data ?? []) as unknown as Product[], total: count ?? 0 });
    });
    return () => { stale = true; };
  }, [shelf, query, page, refreshKey]);

  function changeShelf(next: string) {
    onShelfChange(next as ShelfFilter);
    setPage(0);
  }

  const first = page * PAGE_SIZE + 1;
  const last = results ? page * PAGE_SIZE + results.items.length : 0;

  return <>
    <div className="admin-page-head">
      <h1 className="admin-title is-small">Products</h1>
      <button className="button button-black" onClick={onAdd}><Icon name="plus" />Add product</button>
    </div>
    <Pills
      label="Filter products"
      options={[{ value: "all", label: "All products" }, ...shelves.map(item => ({ value: item.category, label: item.name }))]}
      value={shelf}
      onChange={changeShelf}
      count={option => counts[option as ShelfFilter] ?? "…"}
    />
    <label className="admin-search">
      <Icon name="search" />
      <span className="sr-only">Search products by name</span>
      <input type="search" placeholder="Search products by name" value={search} onChange={event => setSearch(event.target.value)} />
    </label>
    {notice && <p className="admin-notice" role="status">{notice}</p>}
    {failed && <p className="form-status is-error" role="alert">We couldn&apos;t load your products. Please refresh the page.</p>}
    {!failed && !results && <p className="admin-note" role="status">Loading products…</p>}
    {results && results.items.length === 0 && <div className="admin-empty">
      <span className="admin-chip"><Icon name="products" /></span>
      <strong>{query ? "No products match your search" : "No products here yet"}</strong>
      <p>{query ? "Try a different name, or check another category." : "Add your first product and it will appear in the shop."}</p>
    </div>}
    {results && results.items.length > 0 && <>
      <div className="admin-table">
        <table>
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Options</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{results.items.map(item => <tr key={item.id}>
            <td><div className="admin-product"><div className="cart-thumb"><ProductArt item={item} sizes="48px" /></div><span>{item.name}{!item.is_published && <small className="admin-hidden-tag">Hidden</small>}</span></div></td>
            <td>{shelfOf(item.category).singular}</td>
            <td>{money(item.price)}</td>
            <td>{item.variants.length || "—"}</td>
            <td><div className="admin-row-actions">
              <button className="admin-row-link" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} title="Edit"><Icon name="edit" /></button>
              {item.is_published && <Link href={productHref(item)} aria-label={`View ${item.name} in the shop`} title="View in shop" className="admin-row-link"><Icon name="arrow" /></Link>}
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="admin-pager">
        <span>Showing {first}–{last} of {results.total}</span>
        <div>
          <button className="button button-white" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <button className="button button-white" disabled={last >= results.total} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </>}
  </>;
}
