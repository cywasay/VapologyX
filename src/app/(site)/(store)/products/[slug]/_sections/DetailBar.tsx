import { money, type Product } from "@/lib/products";

// The thin bar that sticks under the header with the product name, section links and price.
export function DetailBar({ item, slug, price, hasSpecs }: { item: Product; slug: string; price: number; hasSpecs: boolean }) {
  return <div className="detail-bar">
    <div className="shell detail-bar-inner">
      <strong>{item.name}</strong>
      <nav aria-label={`${item.name} sections`}>
        <a href={`#${slug}-overview`}>Overview</a>
        {hasSpecs && <a href={`#${slug}-specs`}>Specs</a>}
      </nav>
      <span className="detail-bar-price">{money(price)}</span>
    </div>
  </div>;
}
