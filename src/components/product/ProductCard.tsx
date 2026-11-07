"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ProductArt } from "@/components/art";
import { useStore } from "@/components/store/store-context";
import { fewLeft, isSoldOut, money, productHref, saleTag, shelfOf, type Product } from "@/lib/products";

function cardSummary(item: Product) {
  if (item.category === "device" || item.category === "coil") {
    const values = item.specs.slice(0, 2).map(spec => spec.value);
    if (values.length) return values.join(" / ");
  }
  return item.description;
}

export function ProductCard({ item, meta, style }: { item: Product; meta?: string; style?: CSSProperties }) {
  const { quantityOf, add, toast } = useStore();
  const href = productHref(item);
  const quantity = quantityOf(item.id);
  const hasVarieties = item.variants.length > 0;
  const soldOut = isSoldOut(item);
  const few = fewLeft(item);
  const optionAction = item.category === "bottle" || item.category === "disposable" ? "Choose flavor" : "Choose options";
  const added = toast?.kind === "added" && toast.key === item.id;
  return <article className={`product ${soldOut ? "is-sold-out" : ""}`} style={style}>
    <Link href={href} className="product-image" aria-label={`View ${item.name}`} tabIndex={-1}>
      {soldOut ? <span className="badge is-sold">Sold out</span> : saleTag(item) ? <span className="badge is-sale">{saleTag(item)}</span> : item.badge && <span className="badge">{item.badge}</span>}
      <ProductArt item={item} phoneSizes="calc(38vw - 27px)" />
    </Link>
    <span className="product-meta">{meta ?? (item.type || shelfOf(item.category).singular)}</span>
    <h3><Link href={href}>{item.name}</Link></h3>
    <p className="product-specs">{cardSummary(item)}</p>
    <p className="phone-only product-brief">{meta || item.specs.find(spec => spec.value)?.value || item.type || item.description || shelfOf(item.category).singular}</p>
    {few && <p className="stock-note">Only {few} left</p>}
    {item.category === "device" && <Link className="text-link" href={`/coils?fits=${item.id}`} prefetch={false}>View compatible coils</Link>}
    <div className="product-buy">
      <strong>{hasVarieties && "From "}{money(Math.min(item.price, ...item.variants.map(variety => variety.price ?? item.price)))}{item.compare_price && !hasVarieties ? <s className="price-was"><span className="sr-only">, was </span>{money(item.compare_price)}</s> : null}</strong>
      {soldOut
        ? <button className="button button-add" disabled aria-label={`${item.name} is sold out`}>Sold out</button>
        : hasVarieties
        ? <Link className="button button-add" href={href}>
          <span className="phone-hide" aria-hidden="true">Options</span>
          <span className="sr-only phone-hide">Choose options for {item.name}</span>
          <span className="phone-only">{optionAction}<span className="sr-only"> for {item.name}</span></span>
        </Link>
        : <button className="button button-add" onClick={() => add(item)} aria-label={`Add ${item.name} to cart`}>
          <span className="phone-hide">{added ? "✓ Added" : quantity ? `In cart: ${quantity}` : "Add +"}</span>
          <span className="phone-only">{added ? "✓ Added" : "Add to cart"}</span>
        </button>}
    </div>
  </article>;
}
