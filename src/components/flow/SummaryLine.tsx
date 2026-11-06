import { ProductArt } from "@/components/art";
import { money, type Product } from "@/lib/products";

type ArtItem = Pick<Product, "name" | "category" | "type" | "color" | "image_url">;

export function SummaryLine({ art, name, variety, quantity, total }: { art: ArtItem; name: string; variety: string | null; quantity: number; total: number }) {
  return <li className="summary-line">
    <div className="summary-thumb"><ProductArt item={art} sizes="52px" /><b>{quantity}</b></div>
    <div><strong>{name}</strong>{variety && <span>{variety}</span>}</div>
    <span>{money(total)}</span>
  </li>;
}
