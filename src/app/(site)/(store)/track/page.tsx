import type { Metadata } from "next";
import { Suspense } from "react";
import { FlowSkeleton } from "@/components/flow/FlowSkeleton";
import { TrackView } from "./_sections/TrackView";

export const metadata: Metadata = { title: "Track your order", robots: { index: false, follow: false } };

// The view reads the order number from the address, so it waits inside Suspense.
export default function TrackPage() {
  return <Suspense fallback={<FlowSkeleton />}><TrackView /></Suspense>;
}
