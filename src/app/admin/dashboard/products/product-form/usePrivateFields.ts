"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Loaded = { id: string; cost: string; barcode: string };

// The two fields the shop never shows: what one unit costs, and its barcode. They are loaded when a product is opened for editing.
export function usePrivateFields(productId: string | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!productId) return;
    let stale = false;
    const supabase = createClient();
    Promise.all([
      supabase.from("product_costs").select("unit_cost").eq("product_id", productId).maybeSingle(),
      supabase.from("products").select("barcode").eq("id", productId).maybeSingle(),
    ]).then(([cost, barcode]) => {
      if (stale) return;
      setLoaded({
        id: productId,
        // A cost like 1669.777778 is shown without trailing zeros.
        cost: cost.data?.unit_cost == null ? "" : String(Number(cost.data.unit_cost)),
        barcode: (barcode.data as { barcode: string | null } | null)?.barcode ?? "",
      });
    });
    return () => { stale = true; };
  }, [productId]);

  // Until the saved values arrive (or for a new product) the fields are empty, and ready says whether they have arrived.
  return productId && loaded?.id === productId ? { ...loaded, ready: true } : { id: productId ?? "", cost: "", barcode: "", ready: !productId };
}
