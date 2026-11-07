import { FREE_DELIVERY_FROM } from "@/lib/orders";
import { money } from "@/lib/products";
import type { CSSProperties } from "react";

// How close the cart is to free delivery. The bar fills as items are added, and turns into a "you've got it" state at the line.
// The fill is a scaled bar, so growing it costs the phone almost nothing.
export function FreeDeliveryBar({ subtotal }: { subtotal: number }) {
  const left = FREE_DELIVERY_FROM - subtotal;
  const done = left <= 0;
  return <div className={`delivery-bar keep-motion ${done ? "is-done" : ""}`}>
    <p>{done ? <><span aria-hidden="true" className="delivery-tick">✓</span> You&apos;ve got free delivery.</> : <>Add <b>{money(left)}</b> more for free delivery.</>}</p>
    <div className="delivery-track" role="progressbar" aria-label="Progress to free delivery" aria-valuemin={0} aria-valuemax={FREE_DELIVERY_FROM} aria-valuenow={Math.min(subtotal, FREE_DELIVERY_FROM)}>
      <i style={{ "--p": Math.min(1, subtotal / FREE_DELIVERY_FROM) } as CSSProperties} />
    </div>
  </div>;
}
