import Link from "next/link";
import { FreeDeliveryBar } from "@/components/flow/FreeDeliveryBar";
import { SummaryLine } from "@/components/flow/SummaryLine";
import { lineUnitPrice, type CartLine } from "@/lib/cart-store";
import type { orderTotals } from "@/lib/orders";
import { money } from "@/lib/products";

export function CheckoutSummary({ lines, subtotal, totals, pickup, deliveryFree, phone }: { lines: CartLine[]; subtotal: number; totals: ReturnType<typeof orderTotals>; pickup: boolean; deliveryFree: boolean; phone: boolean }) {
  const contents = <>
    <ul className="summary-lines">
      {lines.map(line => <SummaryLine key={line.key} art={line.item} name={line.item.name} variety={line.variety?.name ?? null} quantity={line.quantity} total={lineUnitPrice(line) * line.quantity} />)}
    </ul>
    <dl>
      <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
      <div><dt>{pickup ? "Pickup" : "Delivery"}</dt><dd>{totals.deliveryFee === 0 ? "Free" : money(totals.deliveryFee)}</dd></div>
      <div className="summary-total"><dt>Total</dt><dd>{money(totals.total)}</dd></div>
    </dl>
    {!pickup && !deliveryFree && <FreeDeliveryBar subtotal={subtotal} />}
    <Link className="summary-link" href="/cart">Edit cart</Link>
  </>;
  if (phone) return <details className="summary checkout-summary phone-checkout-summary">
    <summary>
      <span>Order total <strong aria-live="polite">{money(totals.total)}</strong></span>
      <span className="show-items">View items <i aria-hidden="true">⌄</i></span>
      <span className="hide-items">Hide items <i aria-hidden="true">⌃</i></span>
    </summary>
    <div className="checkout-summary-body">{contents}</div>
  </details>;

  return <aside className="summary checkout-summary" aria-label="Order summary">
    <h2>Order summary</h2>
    {contents}
  </aside>;
}
