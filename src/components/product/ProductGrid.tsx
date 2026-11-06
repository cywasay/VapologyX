import type { Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ items, metaFor }: { items: Product[]; metaFor?: (item: Product) => string | undefined }) {
  return <div className="product-grid">{items.map(item => <ProductCard key={item.id} item={item} meta={metaFor?.(item)} />)}</div>;
}
