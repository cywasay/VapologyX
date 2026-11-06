"use client";

import Link from "next/link";
import { useState } from "react";
import { categories } from "@/components/categories";
import type { ShelfCounts } from "./HeroStage";

// Shelves sit side by side as narrow pills; the one under the pointer opens into a full panel.
export function CategoryRail({ counts }: { counts: ShelfCounts }) {
  const [open, setOpen] = useState(0);
  return <div className="rail">
    {categories.map((item, index) => <Link key={item.href} href={item.href} className={`rail-panel ${item.tone} ${index === open ? "is-open" : ""}`}
      onPointerEnter={() => setOpen(index)} onFocus={() => setOpen(index)} aria-label={`${item.name}, ${counts[item.category]} products`}>
      <span className="rail-count">{String(counts[item.category]).padStart(2, "0")}</span>
      <span className="rail-tag" aria-hidden="true">{item.name}</span>
      <span className="rail-copy" aria-hidden="true">
        <strong>{item.name}</strong>
        <span>{item.blurb}</span>
        <em>Shop {item.name.toLowerCase()} <i>→</i></em>
      </span>
      {item.art}
    </Link>)}
  </div>;
}
