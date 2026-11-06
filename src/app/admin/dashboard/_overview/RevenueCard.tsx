import { money } from "@/lib/products";
import { CardHead } from "../../_shared/CardHead";
import { EmptyMeter } from "./EmptyMeter";

export function RevenueCard() {
  return <section className="admin-card is-lime">
    <CardHead icon="revenue" title="Revenue" />
    <p className="admin-figure">{money(0)}</p>
    <p className="admin-caption">No sales yet</p>
    <EmptyMeter cells={7} />
  </section>;
}
