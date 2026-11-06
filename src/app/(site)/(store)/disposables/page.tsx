import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/lib/product-data";
import { ShelfBrowser } from "@/components/shelf/ShelfBrowser";
import { ShelfFallback } from "@/components/shelf/ShelfFallback";
import { ShopHead } from "@/components/ShopHead";

export const metadata: Metadata = { title: "Disposables" };

export default async function DisposablesPage() {
  const initial = await getProducts("disposable");
  return <>
    <ShopHead current="Disposables" text="Placeholder text. A short line about the disposable range goes here." />
    <section className="shell page-body" aria-label="Disposables">
      <Suspense fallback={<ShelfFallback initial={initial} />}><ShelfBrowser category="disposable" initial={initial} /></Suspense>
    </section>
  </>;
}
