import { ProductGrid } from "@/components/product/ProductGrid";
import { Loader } from "@/components/loader/Loader";
import type { ProductPage } from "@/lib/products";

// The first page of a shelf, shown by the server before the browser takes over. The real filters appear in its place.
export function ShelfFallback({ initial }: { initial?: ProductPage }) {
  return <>
    <div className="shelf-tools is-placeholder" aria-hidden="true" />
    {initial ? <ProductGrid items={initial.items} /> : <Loader label="Loading products" />}
  </>;
}
