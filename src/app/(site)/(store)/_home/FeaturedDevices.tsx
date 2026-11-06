import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getProducts } from "@/lib/product-data";

export async function FeaturedDevices() {
  const devices = await getProducts("device", 8);
  return <section className="shell section home-featured" aria-labelledby="featured-devices">
    <div className="section-heading home-reveal"><h2 id="featured-devices">Featured devices</h2><Link className="view-all" href="/devices">View all devices <i aria-hidden="true">→</i></Link></div>
    <ProductGrid items={devices.items.slice(0, 4)} />
  </section>;
}
