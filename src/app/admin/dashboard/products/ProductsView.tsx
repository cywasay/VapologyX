"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader } from "@/components/loader/Loader";
import { shelves, type Product } from "@/lib/products";
import { EmptyState } from "../../_shared/EmptyState";
import { Icon } from "../../_shared/Icon";
import { Pills } from "../../_shared/Pills";
import { useProductCounts, type ShelfFilter } from "../_data/useProductCounts";
import { ProductForm } from "./product-form/ProductForm";
import { ProductSearch } from "./ProductSearch";
import { ProductsPager } from "./ProductsPager";
import { ProductsTable } from "./ProductsTable";
import { useProductList } from "./useProductList";

const shelfOptions = [{ value: "all", label: "All products" }, ...shelves.map(item => ({ value: item.category, label: item.name }))];

// The shelf and the "add a product" request live in the page address, so the overview can link straight to them.
function setAddress(shelf: ShelfFilter, adding: boolean) {
  const params = new URLSearchParams();
  if (shelf !== "all") params.set("shelf", shelf);
  if (adding) params.set("add", "1");
  const text = params.toString();
  window.history.replaceState(null, "", text ? `?${text}` : window.location.pathname);
}

export function ProductsView() {
  const params = useSearchParams();
  const shelf: ShelfFilter = shelves.find(item => item.category === params.get("shelf"))?.category ?? "all";
  const adding = params.get("add") === "1";
  const [editing, setEditing] = useState<Product | null>(null);
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { counts, refresh } = useProductCounts();
  const list = useProductList(shelf, refreshKey);
  const { results } = list;

  function closeForm() {
    setEditing(null);
    if (adding) setAddress(shelf, false);
  }

  function saved(message: string) {
    closeForm();
    setNotice(message);
    setRefreshKey(key => key + 1);
    refresh();
  }

  return <>
    <div className="admin-page-head">
      <h1 className="admin-title is-small">Products</h1>
      <div className="admin-head-actions">
        <Link className="button button-outline" href="/admin/dashboard/products/import">Import from Excel</Link>
        <button className="button button-black" onClick={() => { setNotice(""); setAddress(shelf, true); }}><Icon name="plus" />Add product</button>
      </div>
    </div>
    <Pills label="Filter products" options={shelfOptions} value={shelf} onChange={next => { setAddress(next as ShelfFilter, adding); list.setPage(0); }} count={option => counts[option as ShelfFilter] ?? "…"} />
    <ProductSearch value={list.search} onChange={list.setSearch} />
    {notice && <p className="admin-notice" role="status">{notice}</p>}
    {list.failed && <p className="form-status is-error" role="alert">We couldn&apos;t load your products. Please refresh the page.</p>}
    {!list.failed && !results && <Loader label="Loading products" />}
    {results && results.items.length === 0 && <EmptyState icon="products" title={list.query ? "No products match your search" : "No products here yet"}>{list.query ? "Try a different name, or check another category." : "Add your first product and it will appear in the shop."}</EmptyState>}
    {results && results.items.length > 0 && <>
      <ProductsTable items={results.items} onEdit={product => { setNotice(""); setEditing(product); }} />
      <ProductsPager page={list.page} shown={results.items.length} total={results.total} onPage={list.setPage} />
    </>}
    {(editing || adding) && <ProductForm product={editing} defaultCategory={shelf === "all" ? "device" : shelf} onClose={closeForm} onSaved={saved} />}
  </>;
}
