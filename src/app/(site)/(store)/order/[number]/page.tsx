import type { Metadata } from "next";
import { Suspense } from "react";
import { FlowSkeleton } from "../../../../flow-ui";
import { OrderView } from "../../../../order-view";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

// The order is looked up in the browser, so this page doesn't wait on the server for it. Allowing it to block
// is what lets the shared header read the page address for an order number nobody has opened yet.
export const instant = false;

// One placeholder path is built ahead of time. Every real order number is rendered the first time it's opened.
export function generateStaticParams() {
  return [{ number: "preview" }];
}

// The order number is only known at request time, so it is read inside Suspense.
async function Order({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  return <OrderView key={number} number={number} />;
}

export default function OrderPage(props: { params: Promise<{ number: string }> }) {
  return <Suspense fallback={<FlowSkeleton />}><Order params={props.params} /></Suspense>;
}
