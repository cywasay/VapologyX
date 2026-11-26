import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getProducts } from "@/lib/product-data";
import { showcaseOrder } from "@/lib/products";

export async function PopularBottles() {
  const bottles = await getProducts("bottle", 48);
  return <section className="shell section home-featured" aria-labelledby="featured-bottles">
    <div className="section-heading home-reveal"><h2 id="featured-bottles">Popular bottles</h2><Link className="view-all" href="/bottles">View all bottles <i aria-hidden="true">→</i></Link></div>
    <ProductGrid items={showcaseOrder(bottles.items).slice(0, 4)} />
  </section>;
}
