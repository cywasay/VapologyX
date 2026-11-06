import { ProductGrid } from "@/components/product/ProductGrid";
import { Loader } from "@/components/loader/Loader";
import type { Product } from "@/lib/products";
import { ShelfLinks } from "./ShelfLinks";
import type { ShelfResults } from "./useShelfResults";

// What sits under the filters: the products, or a plain message when there are none yet.
export function ShelfBody({ results, idle, searching, text, filtered, emptyText, metaFor, onClear }: {
  results: ShelfResults;
  idle: boolean;
  searching: boolean;
  text: string;
  filtered: boolean;
  emptyText: string;
  metaFor?: (item: Product) => string | undefined;
  onClear: () => void;
}) {
  const { page, stale, failed, moreFailed, loadingMore, loadMore, retry } = results;

  if (idle) return <div className="shelf-empty"><p>Type a name above, or pick a shelf.</p><ShelfLinks /></div>;
  if (failed) return <div className="shelf-empty"><p role="alert">We couldn&apos;t load these products.</p><button type="button" className="button button-primary" onClick={retry}>Try again</button></div>;
  if (!page) return <Loader label="Loading products" />;
  if (page.items.length === 0 && !stale) {
    return <div className="shelf-empty">
      <p>{searching ? `Nothing matches “${text}”${filtered ? " with these filters" : ""}.` : filtered ? "No products match these filters." : emptyText}</p>
      {filtered && <button type="button" className="button button-primary" onClick={onClear}>Clear filters</button>}
      {searching && <ShelfLinks />}
    </div>;
  }
  return <>
    <div className={`shelf-results ${stale ? "is-busy" : ""}`} aria-busy={stale}>
      <ProductGrid items={page.items} metaFor={metaFor} />
    </div>
    {page.items.length < page.total && <div className="shelf-more">
      <span>Showing {page.items.length} of {page.total}</span>
      <button type="button" className="button button-primary" disabled={loadingMore || stale} onClick={loadMore}>{loadingMore ? "Loading…" : "Load more"}</button>
    </div>}
    {moreFailed && <p className="shelf-message" role="alert">We couldn&apos;t load more products. Please try again.</p>}
  </>;
}
