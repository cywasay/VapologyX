"use client";

import { useStore } from "@/components/store/store-context";
import { cartKey } from "@/lib/cart-store";
import { isSoldOut, money, varietyPrice, type Product, type Variety } from "@/lib/products";

export function AddToCart({ item, variety, compact = false }: { item: Product; variety: Variety | null; compact?: boolean }) {
  const { quantityOf, add, toast } = useStore();
  if (compact) {
    const added = toast?.kind === "added" && toast.key === cartKey(item.id, variety);
    const soldOut = isSoldOut(item);
    return <button className="button button-lime" type="button" disabled={soldOut} aria-label={added && !soldOut ? "Added to cart. Add another" : undefined} onClick={() => add(item, variety)}>
      {soldOut ? "Sold out" : added ? <><span aria-hidden="true">✓</span> Added</> : "Add to cart"}
    </button>;
  }
  const quantity = quantityOf(item.id);
  if (isSoldOut(item)) return <button className="button button-primary detail-add" disabled>Sold out</button>;
  return <button className="button button-primary detail-add" onClick={() => add(item, variety)}>{quantity ? `In cart: ${quantity}. Add another` : `Add to cart · ${money(varietyPrice(item, variety))}`}</button>;
}
