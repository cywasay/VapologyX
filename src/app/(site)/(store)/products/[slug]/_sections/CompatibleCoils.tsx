import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/lib/products";

export function CompatibleCoils({ slug, coils }: { slug: string; coils: Product[] }) {
  if (coils.length === 0) return null;
  return <section className="shell section" id={`${slug}-coils`} aria-labelledby={`${slug}-coils-title`}>
    <div className="section-heading"><h2 id={`${slug}-coils-title`}>Compatible coils</h2></div>
    <ProductGrid items={coils} />
  </section>;
}
