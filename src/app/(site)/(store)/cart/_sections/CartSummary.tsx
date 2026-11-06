import Link from "next/link";
import { FreeDeliveryBar } from "@/components/flow/FreeDeliveryBar";
import { DELIVERY_FEE, FREE_DELIVERY_FROM } from "@/lib/orders";
import { money } from "@/lib/products";

export function CartSummary({ subtotal }: { subtotal: number }) {
  return <aside className="summary" aria-label="Order summary">
    <h2>Summary</h2>
    <dl>
      <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
      <div><dt>Delivery</dt><dd>Worked out at checkout</dd></div>
    </dl>
    <FreeDeliveryBar subtotal={subtotal} />
    <Link className="button button-lime" href="/checkout">Go to checkout</Link>
    <Link className="summary-link" href="/devices">Keep shopping</Link>
    <p className="summary-note">Delivery is {money(DELIVERY_FEE)}, and free over {money(FREE_DELIVERY_FROM)}. Picking up from the store is always free.</p>
  </aside>;
}
