import type { Metadata } from "next";
import { Suspense } from "react";
import { getDeviceOptions, getProducts } from "@/lib/product-data";
import { ShelfBrowser } from "@/components/shelf/ShelfBrowser";
import { ShelfFallback } from "@/components/shelf/ShelfFallback";
import { ShopHead } from "@/components/ShopHead";

export const metadata: Metadata = { title: "Coils" };

export default async function CoilsPage() {
  const [initial, devices] = await Promise.all([getProducts("coil"), getDeviceOptions()]);
  return <>
    <ShopHead current="Coils" text="Select your device to see only the coils that fit it." />
    <section className="shell page-body" aria-label="Coils">
      <Suspense fallback={<ShelfFallback initial={initial} />}><ShelfBrowser category="coil" initial={initial} devices={devices} emptyText="No coils found yet." /></Suspense>
    </section>
  </>;
}
