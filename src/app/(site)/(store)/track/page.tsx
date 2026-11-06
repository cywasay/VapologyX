import type { Metadata } from "next";
import { Suspense } from "react";
import { FlowSkeleton } from "../../../flow-ui";
import { TrackView } from "../../../order-view";

export const metadata: Metadata = { title: "Track your order", robots: { index: false, follow: false } };

// The view reads the order number from the address, so it waits inside Suspense.
export default function TrackPage() {
  return <Suspense fallback={<FlowSkeleton />}><TrackView /></Suspense>;
}
