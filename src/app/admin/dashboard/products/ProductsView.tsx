"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { refreshShop } from "@/lib/product-actions";
import { shelves, type Product } from "@/lib/products";
import { EmptyState } from "../../_shared/EmptyState";
import { Icon } from "../../_shared/Icon";
import { Pager } from "../../_shared/Pager";
import { Pills } from "../../_shared/Pills";
import { TableSkeleton } from "../../_shared/TableSkeleton";
import { UndoToast } from "../../_shared/UndoToast";
import { useProductCounts, type ShelfFilter } from "../_data/useProductCounts";
import { deleteProduct } from "./product-form/saveProduct";
import { ProductForm } from "./product-form/ProductForm";
import { ProductSearch } from "./ProductSearch";
import { ProductsTable } from "./ProductsTable";
import { PAGE_SIZE, useProductList } from "./useProductList";

const shelfOptions = [{ value: "all", label: "All products" }, ...shelves.map(item => ({ value: item.category, label: item.name }))];
// How long a delete can be taken back. Until it runs out the product is only hidden, and nothing has been deleted.
const UNDO_SECONDS = 8;

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
  const [hidden, setHidden] = useState<Product | null>(null);
  const waiting = useRef<{ product: Product; timer: ReturnType<typeof setTimeout> } | null>(null);
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

  // Really deletes a product (and its photos) once its undo time is up, then brings the lists up to date.
  const finishDelete = useCallback(async (product: Product) => {
    if (waiting.current?.product.id === product.id) waiting.current = null;
    const failure = await deleteProduct(product);
    await refreshShop().catch(() => undefined);
    setHidden(current => current?.id === product.id ? null : current);
    setNotice(failure ? `${product.name} couldn't be deleted. ${failure}` : `${product.name} deleted.`);
    setRefreshKey(key => key + 1);
    refresh();
  }, [refresh]);

  function requestDelete(product: Product) {
    const earlier = waiting.current;
    if (earlier) {
      clearTimeout(earlier.timer);
      void finishDelete(earlier.product);
    }
    closeForm();
    setNotice("");
    setHidden(product);
    waiting.current = { product, timer: setTimeout(() => void finishDelete(product), UNDO_SECONDS * 1000) };
  }

  function undoDelete() {
    const pending = waiting.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    waiting.current = null;
    setHidden(null);
    setNotice(`${pending.product.name} is back.`);
  }

  // Leaving the page while a delete is waiting finishes it, so what was asked for still happens.
  useEffect(() => () => {
    const pending = waiting.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    void deleteProduct(pending.product).then(() => refreshShop().catch(() => undefined));
  }, []);

  const items = results?.items.filter(item => item.id !== hidden?.id) ?? [];
  const total = (results?.total ?? 0) - (results && hidden && results.items.some(item => item.id === hidden.id) ? 1 : 0);

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
    {!list.failed && !results && <TableSkeleton label="Loading products" headers={["Product", "Category", "Price", "Stock", "Options", ""]} />}
    {results && items.length === 0 && <EmptyState icon="products" title={list.query ? "No products match your search" : "No products here yet"}>{list.query ? "Try a different name, or check another category." : "Add your first product and it will appear in the shop."}</EmptyState>}
    {results && items.length > 0 && <>
      <ProductsTable items={items} onEdit={product => { setNotice(""); setEditing(product); }} />
      <Pager page={list.page} pageSize={PAGE_SIZE} shown={items.length} total={total} onPage={list.setPage} />
    </>}
    {hidden && <UndoToast key={hidden.id} message={`${hidden.name} deleted.`} seconds={UNDO_SECONDS} onUndo={undoDelete} />}
    {(editing || adding) && <ProductForm product={editing} defaultCategory={shelf === "all" ? "device" : shelf} onClose={closeForm} onSaved={saved} onDelete={requestDelete} />}
  </>;
}

