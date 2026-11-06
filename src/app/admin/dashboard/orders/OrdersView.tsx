"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "../../_shared/EmptyState";
import { Icon } from "../../_shared/Icon";
import { Pager } from "../../_shared/Pager";
import { Pills } from "../../_shared/Pills";
import { useOrderStats } from "../_data/useOrderStats";
import { OrderDialog } from "./OrderDialog";
import { orderOptions, orderStatuses, statusName } from "./orderStatuses";
import { OrdersTable } from "./OrdersTable";
import { ORDERS_PAGE_SIZE, useOrderList, type AdminOrder } from "./useOrderList";

export function OrdersView() {
  const asked = useSearchParams().get("status");
  const status = orderStatuses.find(item => item === asked) ?? "all";
  const [open, setOpen] = useState<AdminOrder | null>(null);
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { count, refresh } = useOrderStats();
  const list = useOrderList(status, refreshKey);
  const { results } = list;

  function changed(message: string) {
    setOpen(null);
    setNotice(message);
    setRefreshKey(key => key + 1);
    refresh();
  }

  const label = status === "all" ? "" : `${statusName[status as keyof typeof statusName].toLowerCase()} `;
  return <>
    <h1 className="admin-title is-small">Orders</h1>
    <Pills label="Filter orders" options={orderOptions} value={status} onChange={next => { window.history.replaceState(null, "", next === "all" ? window.location.pathname : `?status=${next}`); list.setPage(0); }} count={option => count(option)} />
    <label className="admin-search">
      <Icon name="search" />
      <span className="sr-only">Search orders by number, name or mobile</span>
      <input type="search" placeholder="Search by order number, name or mobile" value={list.search} onChange={event => list.setSearch(event.target.value)} />
    </label>
    {notice && <p className="admin-notice" role="status">{notice}</p>}
    {list.failed && <p className="form-status is-error" role="alert">We couldn&apos;t load your orders. Please refresh the page.</p>}
    {!list.failed && !results && <p className="admin-note" role="status">Loading orders…</p>}
    {results && results.items.length === 0 && <EmptyState icon="orders" title={list.query ? "No orders match your search" : `No ${label}orders yet`}>{list.query ? "Try an order number, a name or a mobile number." : "Orders placed in the shop will appear here."}</EmptyState>}
    {results && results.items.length > 0 && <>
      <OrdersTable items={results.items} onOpen={order => { setNotice(""); setOpen(order); }} />
      <Pager page={list.page} pageSize={ORDERS_PAGE_SIZE} shown={results.items.length} total={results.total} onPage={list.setPage} />
    </>}
    {open && <OrderDialog order={open} onClose={() => setOpen(null)} onChanged={changed} />}
  </>;
}
