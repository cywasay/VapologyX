import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getProducts } from "@/lib/product-data";

export async function PopularBottles() {
  const bottles = await getProducts("bottle", 4);
  return <section className="sheet home-sheet home-featured" aria-labelledby="featured-bottles">
    <div className="shell">
      <div className="section-heading home-reveal"><h2 id="featured-bottles">Popular bottles</h2><Link className="view-all" href="/bottles">View all bottles <i aria-hidden="true">→</i></Link></div>
      <ProductGrid items={bottles.items} />
    </div>
  </section>;
}
