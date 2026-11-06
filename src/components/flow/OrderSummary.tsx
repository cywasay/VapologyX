import type { Order } from "@/lib/orders";
import { money } from "@/lib/products";
import { SummaryLine } from "./SummaryLine";

export function OrderSummary({ order }: { order: Order }) {
  return <aside className="summary" aria-label="Order summary">
    <h2>Order summary</h2>
    <ul className="summary-lines">
      {order.lines.map((line, index) => <SummaryLine key={`${line.productId}-${line.variety ?? ""}-${index}`} art={line} name={line.name} variety={line.variety} quantity={line.quantity} total={line.unitPrice * line.quantity} />)}
    </ul>
    <dl>
      <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
      <div><dt>{order.delivery.method === "pickup" ? "Pickup" : "Delivery"}</dt><dd>{order.deliveryFee === 0 ? "Free" : money(order.deliveryFee)}</dd></div>
      <div className="summary-total"><dt>Total</dt><dd>{money(order.total)}</dd></div>
    </dl>
  </aside>;
}
