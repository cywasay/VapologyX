"use client";

import { AnimatedNumber } from "../../_shared/AnimatedNumber";
import { CardHead } from "../../_shared/CardHead";
import { useOrderStats } from "../_data/useOrderStats";
import { EmptyMeter } from "./EmptyMeter";

// Orders that still need work: new ones and confirmed ones that haven't gone out yet.
export function OrdersCard() {
  const { count, loaded } = useOrderStats();
  const toPack = count("placed") + count("confirmed");
  return <section className="admin-card">
    <CardHead icon="orders" title="Orders to pack" />
    <p className="admin-figure">{loaded ? <AnimatedNumber value={toPack} /> : "…"}</p>
    <p className="admin-caption">{!loaded ? "Loading" : toPack === 0 ? "No orders waiting" : `${count("placed")} new, ${count("confirmed")} confirmed`}</p>
    <EmptyMeter cells={8} />
  </section>;
}
