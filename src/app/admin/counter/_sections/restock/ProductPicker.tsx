"use client";

import { useEffect, useState } from "react";
import { shelfOf, type Category } from "@/lib/products";
import { createClient } from "@/utils/supabase/client";

export type PickedProduct = { id: string; name: string; category: Category; stock: number };

// Finds a product by typing part of its name. Only products whose stock is counted can be picked.
export function ProductPicker({ picked, onPick }: { picked: PickedProduct | null; onPick: (product: PickedProduct | null) => void }) {
  const [text, setText] = useState("");
  const [found, setFound] = useState<PickedProduct[]>([]);

  useEffect(() => {
    const query = text.trim();
    if (!query) return;
    let stale = false;
    const timer = setTimeout(() => {
      createClient().from("products").select("id,name,category,stock").not("stock", "is", null)
        .ilike("name", `%${query.replace(/[\\%_]/g, "\\$&")}%`).order("name").limit(8)
        .then(({ data }) => { if (!stale) setFound((data ?? []) as PickedProduct[]); });
    }, 250);
    return () => { stale = true; clearTimeout(timer); };
  }, [text]);

  if (picked) return <div className="ct-picked">
    <span><strong>{picked.name}</strong><small>{shelfOf(picked.category).singular} · {picked.stock} in stock</small></span>
    <button type="button" className="ct-link" onClick={() => { onPick(null); setText(""); setFound([]); }}>Change</button>
  </div>;

  return <div className="ct-picker">
    <input value={text} placeholder="Type a product name" aria-label="Product" onChange={event => { setText(event.target.value); if (!event.target.value.trim()) setFound([]); }} />
    {text.trim() && <ul>
      {found.map(product => <li key={product.id}><button type="button" onClick={() => onPick(product)}>{product.name}<small>{shelfOf(product.category).singular} · {product.stock} in stock</small></button></li>)}
      {found.length === 0 && <li className="ct-hint">No product found.</li>}
    </ul>}
  </div>;
}
