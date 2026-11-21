import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, getTypes } from "@/lib/product-data";
import { ShelfBrowser } from "@/components/shelf/ShelfBrowser";
import { ShelfFallback } from "@/components/shelf/ShelfFallback";
import { ShopHead } from "@/components/ShopHead";

export const metadata: Metadata = { title: "Bottles" };

export default async function BottlesPage() {
  const [initial, types] = await Promise.all([getProducts("bottle"), getTypes("bottle")]);
  return <>
    <ShopHead current="Bottles" text="Bottled e-liquids in many flavours, brands and nicotine strengths." />
    <section className="shell page-body" aria-label="Bottles">
      <Suspense fallback={<ShelfFallback initial={initial} />}><ShelfBrowser category="bottle" initial={initial} types={types} typeLabel="Flavor group" /></Suspense>
    </section>
  </>;
}
