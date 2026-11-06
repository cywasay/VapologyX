import { CardHead } from "../../_shared/CardHead";
import { EmptyMeter } from "./EmptyMeter";

export function OrdersCard() {
  return <section className="admin-card">
    <CardHead icon="orders" title="Orders to pack" />
    <p className="admin-figure">0</p>
    <p className="admin-caption">No orders waiting</p>
    <EmptyMeter cells={8} />
  </section>;
}
