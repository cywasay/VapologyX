"use client";

import { FlowNotices } from "@/components/flow/FlowNotices";
import { FlowSteps } from "@/components/flow/FlowSteps";
import { Loader } from "@/components/loader/Loader";
import { useStore } from "@/components/store/store-context";
import { useCartSync, useHydrated } from "@/lib/cart-store";
import { CartEmpty } from "./CartEmpty";
import { CartRow } from "./CartRow";
import { CartSummary } from "./CartSummary";

// The cart page. It waits for the browser to load the saved cart, then checks it against the live shop.
export function CartView() {
  const hydrated = useHydrated();
  const { lines, count, subtotal, setQuantity, remove } = useStore();
  const sync = useCartSync();

  return <section className="shell flow" aria-labelledby="cart-page-title">
    <div className="flow-head">
      <FlowSteps current={1} />
      <h1 id="cart-page-title">Your cart</h1>
      {hydrated && count > 0 && <p>{count} {count === 1 ? "item" : "items"} ready to order.</p>}
    </div>

    <FlowNotices sync={sync} />

    {!hydrated && <Loader label="Loading your cart" />}
    {hydrated && lines.length === 0 && <CartEmpty />}
    {hydrated && lines.length > 0 && <div className="cart-layout">
      <ul className="cart-list panel-light">
        {lines.map(line => <CartRow key={line.key} line={line} lines={lines} onQuantity={setQuantity} onRemove={remove} />)}
      </ul>
      <CartSummary subtotal={subtotal} />
    </div>}
  </section>;
}
