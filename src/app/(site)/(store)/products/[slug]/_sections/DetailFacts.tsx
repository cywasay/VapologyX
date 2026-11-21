"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useDelivery } from "@/components/store/delivery-context";
import { money } from "@/lib/products";

// Short, always-true shop facts under the buy box: delivery (from admin Settings), pickup, payment and help.
export function DetailFacts({ price }: { price: number }) {
  const { fee, freeFrom } = useDelivery();
  const facts: [string, ReactNode][] = [
    ["Delivery", price >= freeFrom ? "Free delivery on this item" : `${money(fee)}, free on orders from ${money(freeFrom)}`],
    ["Pickup", "Free from the store"],
    ["Payment", "Cash on delivery or bank transfer"],
    ["Questions?", <Link key="ask" href="/contact">Ask the store</Link>],
  ];
  return <dl className="detail-facts" aria-label="Good to know">
    {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
  </dl>;
}
