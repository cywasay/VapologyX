import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, getTypes } from "../../../product-data";
import { ShelfBrowser, ShelfFallback } from "../../../shelf-browser";
import { ShopHead } from "../../../site-blocks";

export const metadata: Metadata = { title: "Bottles" };

export default async function BottlesPage() {
  const [initial, types] = await Promise.all([getProducts("bottle"), getTypes("bottle")]);
  return <>
    <ShopHead current="Bottles" text="Placeholder text. A short line about the flavor range goes here." />
    <section className="shell page-body" aria-label="Bottles">
      <Suspense fallback={<ShelfFallback initial={initial} />}><ShelfBrowser category="bottle" initial={initial} types={types} typeLabel="Flavor group" /></Suspense>
    </section>
  </>;
}
