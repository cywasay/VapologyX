"use client";

import { ProductArt } from "@/components/art";
import { useStore } from "@/components/store/store-context";
import { lineName } from "@/lib/cart-store";

// The small note at the bottom of the screen after something is added to the cart.
export function CartToast() {
  const { toast, lines, openCart } = useStore();
  const addedLine = toast?.kind === "added" ? lines.find(line => line.key === toast.key) : undefined;
  return <div className="cart-toast-region" role="status">
    {addedLine && <div className="cart-toast">
      <div className="cart-thumb"><ProductArt item={addedLine.item} sizes="48px" /></div>
      <div><strong>Added to cart</strong><span>{lineName(addedLine)}</span></div>
      <button className="button button-primary" onClick={openCart}>View cart</button>
    </div>}
    {toast?.kind === "message" && <div className="cart-toast is-message"><strong>{toast.text}</strong></div>}
  </div>;
}
