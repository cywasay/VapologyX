"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FlowSkeleton } from "@/components/flow/FlowSkeleton";
import { FlowSteps } from "@/components/flow/FlowSteps";
import { OrderCelebration } from "@/components/flow/OrderCelebration";
import { OrderDetails } from "@/components/flow/OrderDetails";
import { OrderNumber } from "@/components/flow/OrderNumber";
import { OrderSummary } from "@/components/flow/OrderSummary";
import { findOrder, type Order } from "@/lib/orders";
import { NextSteps } from "./NextSteps";
import { OrderMissing } from "./OrderMissing";

type OrderResult = { state: "loading" } | { state: "missing" } | { state: "found"; order: Order };

// The confirmation page, opened straight after checkout.
export function OrderView({ number }: { number: string }) {
  const [result, setResult] = useState<OrderResult>({ state: "loading" });

  useEffect(() => {
    let stale = false;
    findOrder(number).then(order => { if (!stale) setResult(order ? { state: "found", order } : { state: "missing" }); });
    return () => { stale = true; };
  }, [number]);

  if (result.state === "loading") return <FlowSkeleton />;
  if (result.state === "missing") return <OrderMissing number={number} />;

  const { order } = result;
  return <section className="shell flow" aria-labelledby="order-title">
    <div className="flow-head">
      <FlowSteps current={3} />
      <OrderCelebration number={order.number} />
      <h1 id="order-title">Thank you, {order.customer.name.split(" ")[0]}.</h1>
      <p>Your order is in. This is your order number:</p>
      <OrderNumber number={order.number} />
    </div>
    <div className="order-layout">
      <div className="order-main">
        <NextSteps order={order} />
        <div className="panel-light checkout-card">
          <h2>Your details</h2>
          <OrderDetails order={order} />
        </div>
        <div className="order-actions">
          <Link className="button button-primary" href={`/track?number=${encodeURIComponent(order.number)}`}>Track this order</Link>
          <Link className="button button-outline" href="/devices">Keep shopping</Link>
        </div>
      </div>
      <OrderSummary order={order} />
    </div>
  </section>;
}
