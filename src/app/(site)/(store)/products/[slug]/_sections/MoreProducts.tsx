import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getProducts } from "@/lib/product-data";
import { shelfOf, type Product } from "@/lib/products";

// Other products from the same shelf.
export async function MoreProducts({ item }: { item: Product }) {
  const shelf = shelfOf(item.category);
  const more = await getProducts(item.category, 5);
  return <section className="shell section detail-last" aria-labelledby={`${item.slug}-more-title`}>
    <div className="section-heading"><h2 id={`${item.slug}-more-title`}>More {shelf.name.toLowerCase()}</h2><Link className="view-all" href={shelf.href}>View all <i aria-hidden="true">→</i></Link></div>
    <ProductGrid items={more.items.filter(other => other.id !== item.id).slice(0, 4)} />
  </section>;
}
