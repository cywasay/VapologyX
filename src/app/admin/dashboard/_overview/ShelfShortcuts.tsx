"use client";

import Link from "next/link";
import { shelves } from "@/app/products";
import { categories } from "@/app/site-blocks";
import { Icon } from "../../_shared/Icon";
import { useProductCounts } from "../_data/useProductCounts";
import { DASHBOARD } from "../_shell/navItems";

// One row per shelf, with how many products it holds. Each opens the product list on that shelf.
export function ShelfShortcuts() {
  const { counts } = useProductCounts();
  return <>
    {shelves.map(item => <Link key={item.category} className="admin-shelf" href={`${DASHBOARD}/products?shelf=${item.category}`}>
      <span className="admin-chip is-art">{categories.find(category => category.name === item.name)?.art}</span>
      <span><strong>{item.name}</strong><small>{counts[item.category] ?? "…"} products</small></span>
      <Icon name="arrow" />
    </Link>)}
  </>;
}
