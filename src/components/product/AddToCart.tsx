"use client";

import { useStore } from "@/components/store/store-context";
import { isSoldOut, money, varietyPrice, type Product, type Variety } from "@/lib/products";

export function AddToCart({ item, variety }: { item: Product; variety: Variety | null }) {
  const { quantityOf, add } = useStore();
  const quantity = quantityOf(item.id);
  if (isSoldOut(item)) return <button className="button button-primary detail-add" disabled>Sold out</button>;
  return <button className="button button-primary detail-add" onClick={() => add(item, variety)}>{quantity ? `In cart: ${quantity}. Add another` : `Add to cart · ${money(varietyPrice(item, variety))}`}</button>;
}
