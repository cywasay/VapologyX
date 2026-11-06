import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/lib/products";

export function WorksWith({ slug, devices }: { slug: string; devices: Product[] }) {
  if (devices.length === 0) return null;
  return <section className="shell section" aria-labelledby={`${slug}-devices-title`}>
    <div className="section-heading"><h2 id={`${slug}-devices-title`}>Works with</h2></div>
    <ProductGrid items={devices} />
  </section>;
}
