"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { FlowNotices } from "@/components/flow/FlowNotices";
import { FlowSteps } from "@/components/flow/FlowSteps";
import { Loader } from "@/components/loader/Loader";
import { useStore } from "@/components/store/store-context";
import { useCartSync, useHydrated, type CartLine } from "@/lib/cart-store";
import { CheckoutForm } from "./CheckoutForm";

export function CheckoutView() {
  const hydrated = useHydrated();
  const { lines } = useStore();
  const sync = useCartSync();
  // Placing an order empties the cart, so the page keeps showing what was ordered until the confirmation opens.
  const [placed, setPlaced] = useState<CartLine[] | null>(null);
  const shown = placed ?? lines;
  // Next.js keeps this page alive, hidden, when the customer moves on. Once an order has gone through, forget it as
  // the page is hidden, so the next visit starts a fresh checkout. A half-filled form is left alone.
  const placedAnOrder = useRef(false);
  useLayoutEffect(() => () => {
    if (!placedAnOrder.current) return;
    placedAnOrder.current = false;
    setPlaced(null);
  }, []);

  return <section className="shell flow" aria-labelledby="checkout-title">
    <div className="flow-head">
      <FlowSteps current={2} />
      <h1 id="checkout-title">Checkout</h1>
    </div>

    <FlowNotices sync={sync} warnWhenFailed />

    {!hydrated && <Loader label="Loading checkout" />}

    {hydrated && shown.length === 0 && <div className="flow-empty panel-light">
      <h2>There&apos;s nothing to check out.</h2>
      <p>Your cart is empty. Add something from a shelf first.</p>
      <Link className="button button-primary" href="/devices">Shop devices</Link>
    </div>}

    {hydrated && shown.length > 0 && <CheckoutForm lines={shown} locked={placed !== null} onPlaced={ordered => { placedAnOrder.current = true; setPlaced(ordered); }} />}
  </section>;
}
