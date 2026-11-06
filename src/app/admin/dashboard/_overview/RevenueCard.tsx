"use client";

import { money } from "@/lib/products";
import { CardHead } from "../../_shared/CardHead";
import { useOrderStats } from "../_data/useOrderStats";
import { EmptyMeter } from "./EmptyMeter";

// Everything ordered so far, not counting cancelled orders.
export function RevenueCard() {
  const { stats, loaded, count } = useOrderStats();
  const orders = count("all") - count("cancelled");
  return <section className="admin-card is-lime">
    <CardHead icon="revenue" title="Revenue" />
    <p className="admin-figure">{loaded ? money(stats.revenue) : "…"}</p>
    <p className="admin-caption">{!loaded ? "Loading" : orders === 0 ? "No sales yet" : `From ${orders} ${orders === 1 ? "order" : "orders"}`}</p>
    <EmptyMeter cells={7} />
  </section>;
}
