import Link from "next/link";
import { FreeDeliveryBar } from "@/components/flow/FreeDeliveryBar";
import { PhoneBottomBar } from "@/components/store/PhoneBottomBar";
import { useDelivery } from "@/components/store/delivery-context";
import { usePhoneLayout } from "@/lib/phone-layout";
import { money } from "@/lib/products";

export function CartSummary({ subtotal }: { subtotal: number }) {
  const phone = usePhoneLayout();
  const { fee, freeFrom } = useDelivery();
  return <aside className="summary" aria-label="Order summary">
    <h2>Summary</h2>
    <dl>
      <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
      <div><dt>Delivery</dt><dd>Worked out at checkout</dd></div>
    </dl>
    <FreeDeliveryBar subtotal={subtotal} />
    <Link className="button button-lime phone-hide" href="/checkout">Go to checkout</Link>
    {phone && <PhoneBottomBar label="Cart subtotal and checkout">
      <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
      <Link className="button button-lime" href="/checkout" prefetch={false}>Checkout</Link>
    </PhoneBottomBar>}
    <Link className="summary-link" href="/devices">Keep shopping</Link>
    <p className="summary-note">Delivery is {money(fee)}, and free from {money(freeFrom)}. Picking up from the store is always free.</p>
  </aside>;
}
