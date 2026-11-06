"use client";

import { useSearchParams } from "next/navigation";
import { EmptyState } from "../../_shared/EmptyState";
import { Pills } from "../../_shared/Pills";
import { orderOptions, orderStatuses } from "./orderStatuses";

export function OrdersView() {
  const asked = useSearchParams().get("status");
  const status = orderStatuses.find(item => item === asked) ?? orderStatuses[0];

  return <>
    <h1 className="admin-title is-small">Orders</h1>
    <Pills label="Filter orders" options={orderOptions} value={status} onChange={next => window.history.replaceState(null, "", `?status=${encodeURIComponent(next)}`)} count={() => 0} />
    <EmptyState icon="orders" title={status === "All orders" ? "No orders yet" : `No ${status.toLowerCase()} orders`}>Orders will appear here once checkout is connected.</EmptyState>
  </>;
}
