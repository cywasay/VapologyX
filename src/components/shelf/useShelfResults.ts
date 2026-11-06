"use client";

import { useEffect, useRef, useState } from "react";
import { fetchProducts } from "@/lib/product-query";
import type { Category, ProductPage } from "@/lib/products";

type Loaded = ProductPage & { key: string };

// Finds the products for a query. The first page of the default view comes from the server; everything else is fetched here.
export function useShelfResults(scope: Category | null, key: string, initial: ProductPage | undefined, idle: boolean) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [moreFailedKey, setMoreFailedKey] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // What `loaded` holds, so that coming back to a page doesn't fetch it again and lose the pages already loaded.
  const loadedKey = useRef<string | null>(null);
  const latestKey = useRef(key);
  useEffect(() => { latestKey.current = key; });

  const fromServer = key === "" && initial !== undefined;
  const current: ProductPage | null = loaded?.key === key ? loaded : fromServer ? initial : null;
  const page = current ?? loaded ?? initial ?? null;

  useEffect(() => {
    if (idle || fromServer || loadedKey.current === key) return;
    let stale = false;
    fetchProducts(scope, key, 0).then(
      result => {
        if (stale) return;
        loadedKey.current = key;
        setLoaded({ ...result, key });
        setFailedKey(null);
      },
      () => { if (!stale) setFailedKey(key); },
    );
    return () => { stale = true; };
  }, [scope, key, idle, fromServer, attempt]);

  async function loadMore() {
    if (!current || loadingMore) return;
    setLoadingMore(true);
    setMoreFailedKey(null);
    try {
      const next = await fetchProducts(scope, key, current.items.length);
      if (latestKey.current === key) {
        const items = [...new Map([...current.items, ...next.items].map(item => [item.id, item])).values()];
        loadedKey.current = key;
        setLoaded({ items, total: next.total, key });
      }
    } catch {
      setMoreFailedKey(key);
    }
    setLoadingMore(false);
  }

  return {
    page,
    // True while the products shown belong to the previous filters and the new ones are on their way.
    stale: !idle && current === null && page !== null,
    failed: !idle && current === null && failedKey === key,
    moreFailed: moreFailedKey === key,
    loadingMore,
    loadMore,
    retry: () => { setFailedKey(null); setAttempt(count => count + 1); },
  };
}

export type ShelfResults = ReturnType<typeof useShelfResults>;
