import type { Metadata } from "next";
import { Suspense } from "react";
import { ShelfBrowser, ShelfFallback } from "../../../shelf-browser";
import { PageHead } from "../../../site-blocks";

// Search results change with every word, so they are not worth showing in a search engine.
export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default function SearchPage() {
  return <>
    <PageHead eyebrow="Search" title="Find a product" text="Look up devices, disposables, bottles and coils by name, type or flavor." />
    <section className="shell page-body" aria-label="Search results">
      <Suspense fallback={<ShelfFallback />}><ShelfBrowser category={null} /></Suspense>
    </section>
  </>;
}
