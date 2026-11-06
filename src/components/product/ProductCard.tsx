"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ProductArt } from "@/components/art";
import { useStore } from "@/components/store/store-context";
import { fewLeft, isSoldOut, money, productHref, shelfOf, type Product } from "@/lib/products";

function cardSummary(item: Product) {
  if (item.category === "device" || item.category === "coil") {
    const values = item.specs.slice(0, 2).map(spec => spec.value);
    if (values.length) return values.join(" / ");
  }
  return item.description;
}

export function ProductCard({ item, meta, style }: { item: Product; meta?: string; style?: CSSProperties }) {
  const { quantityOf, add } = useStore();
  const href = productHref(item);
  const quantity = quantityOf(item.id);
  const hasVarieties = item.variants.length > 0;
  const soldOut = isSoldOut(item);
  const few = fewLeft(item);
  return <article className={`product ${soldOut ? "is-sold-out" : ""}`} style={style}>
    <Link href={href} className="product-image" aria-label={`View ${item.name}`} tabIndex={-1}>
      {soldOut ? <span className="badge is-sold">Sold out</span> : item.badge && <span className="badge">{item.badge}</span>}
      <ProductArt item={item} />
    </Link>
    <span className="product-meta">{meta ?? (item.type || shelfOf(item.category).singular)}</span>
    <h3><Link href={href}>{item.name}</Link></h3>
    <p className="product-specs">{cardSummary(item)}</p>
    {few && <p className="stock-note">Only {few} left</p>}
    {item.category === "device" && <Link className="text-link" href={`/coils?fits=${item.id}`} prefetch={false}>View compatible coils</Link>}
    <div className="product-buy">
      <strong>{hasVarieties && "From "}{money(Math.min(item.price, ...item.variants.map(variety => variety.price ?? item.price)))}</strong>
      {soldOut
        ? <button className="button button-add" disabled aria-label={`${item.name} is sold out`}>Sold out</button>
        : hasVarieties
        ? <Link className="button button-add" href={href} aria-label={`Choose options for ${item.name}`}>Options</Link>
        : <button className="button button-add" onClick={() => add(item)} aria-label={`Add ${item.name} to cart`}>{quantity ? `In cart: ${quantity}` : "Add +"}</button>}
    </div>
  </article>;
}
