"use client";

import Link from "next/link";
import { ProductArt } from "@/components/art";
import { useStore } from "@/components/store/store-context";
import { isSoldOut, money, productHref, type Product } from "@/lib/products";

export const PANEL_COILS = 3;

// The coils that fit this device, right next to the buy button, so they can be added in one go.
// Shows the first few; the full list further down the page only appears when there are more.
export function DetailCoils({ slug, coils }: { slug: string; coils: Product[] }) {
  const { add, quantityOf, toast } = useStore();
  if (coils.length === 0) return null;
  return <section className="detail-coils" aria-labelledby={`${slug}-fits-title`}>
    <h2 id={`${slug}-fits-title`} className="detail-panel-title">Fits these coils</h2>
    <ul>
      {coils.slice(0, PANEL_COILS).map(coil => {
        const added = toast?.kind === "added" && toast.key === coil.id;
        const quantity = quantityOf(coil.id);
        return <li key={coil.id}>
          <Link href={productHref(coil)} className="detail-coil-art" tabIndex={-1} aria-hidden="true"><ProductArt item={coil} sizes="56px" /></Link>
          <div>
            <Link href={productHref(coil)}>{coil.name}</Link>
            <span>{money(coil.price)}</span>
          </div>
          {isSoldOut(coil)
            ? <span className="detail-coil-sold">Sold out</span>
            : coil.variants.length > 0
            ? <Link className="button button-add" href={productHref(coil)}>Options</Link>
            : <button type="button" className="button button-add" onClick={() => add(coil)} aria-label={`Add ${coil.name} to cart`}>{added ? "✓ Added" : quantity ? `In cart: ${quantity}` : "Add +"}</button>}
        </li>;
      })}
    </ul>
    {coils.length > PANEL_COILS && <a className="text-link" href={`#${slug}-coils`}>See all {coils.length} coils</a>}
  </section>;
}
