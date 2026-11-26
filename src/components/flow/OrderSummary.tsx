import type { Order } from "@/lib/orders";
import { LOYALTY, points } from "@/lib/loyalty";
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
      {(order.pointsUsed ?? 0) > 0 && <div><dt>Loyalty points</dt><dd>−{money((order.pointsUsed ?? 0) * LOYALTY.pointValue)}</dd></div>}
      <div className="summary-total"><dt>Total</dt><dd>{money(order.total)}</dd></div>
    </dl>
    {(order.pointsEarned ?? 0) > 0 && <p className="summary-note">You earned {points(order.pointsEarned ?? 0)} with this order.</p>}
    {order.pointsBalance !== undefined && <p className="summary-points"><b>{LOYALTY.name}</b> Your online points: {points(order.pointsBalance)}</p>}
  </aside>;
}
