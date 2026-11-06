import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, getTypes } from "@/lib/product-data";
import { ShelfBrowser } from "@/components/shelf/ShelfBrowser";
import { ShelfFallback } from "@/components/shelf/ShelfFallback";
import { ShopHead } from "@/components/ShopHead";

export const metadata: Metadata = { title: "Devices" };

export default async function DevicesPage() {
  const [initial, types] = await Promise.all([getProducts("device"), getTypes("device")]);
  return <>
    <ShopHead current="Devices" text="Placeholder text. A short line about the device range goes here." />
    <section className="shell page-body" aria-label="Devices">
      <Suspense fallback={<ShelfFallback initial={initial} />}><ShelfBrowser category="device" initial={initial} types={types} /></Suspense>
    </section>
  </>;
}
