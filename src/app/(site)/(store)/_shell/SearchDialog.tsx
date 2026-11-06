"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ProductArt, SearchGlyph } from "@/components/art";
import { useStore } from "@/components/store/store-context";
import { searchProducts } from "@/lib/product-query";
import { money, productHref, shelfOf, type Product } from "@/lib/products";
import { categories } from "@/components/categories";

// Results appear a moment after typing stops, and only for two letters or more.
const WAIT = 220;
const MIN_LENGTH = 2;
const SHOWN = 6;

type Found = { term: string; items: Product[]; total: number } | { term: string; failed: true };

// The search window opened from the header. It shows the best few matches as you type; Enter opens the full results page.
export function SearchDialog() {
  const { searchDialog: dialog } = useStore();
  const router = useRouter();
  const [text, setText] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const term = text.replace(/\s+/g, " ").trim();
  const ready = term.length >= MIN_LENGTH;

  useEffect(() => {
    if (!ready) return;
    let stale = false;
    const timer = setTimeout(() => {
      searchProducts(term, SHOWN).then(
        page => { if (!stale) setFound({ term, ...page }); },
        () => { if (!stale) setFound({ term, failed: true }); },
      );
    }, WAIT);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [term, ready]);

  const close = () => dialog.current?.close();
  const current = ready && found?.term === term ? found : null;
  const resultsHref = `/search?q=${encodeURIComponent(term)}`;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!term) return;
    close();
    router.push(resultsHref);
  }

  return <dialog ref={dialog} className="search-dialog" aria-label="Search the shop" onClose={() => { setText(""); setFound(null); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <form className="search-form" role="search" onSubmit={submit}>
      <SearchGlyph />
      <input type="search" value={text} placeholder="Search products" aria-label="Search products" autoComplete="off" enterKeyHint="search" maxLength={80} onChange={event => setText(event.target.value)} />
      <button type="button" className="search-close" onClick={close} aria-label="Close search">×</button>
    </form>
    <div className="search-body" aria-live="polite">
      {!ready && <>
        <p className="search-hint">Or browse a shelf</p>
        <div className="menu-tiles search-shelves">
          {categories.map(item => <Link key={item.href} href={item.href} onClick={close}>{item.art}<span>{item.name}</span></Link>)}
        </div>
      </>}
      {ready && !current && <p className="search-hint" role="status">Searching…</p>}
      {current && "failed" in current && <p className="search-hint" role="alert">Search isn&apos;t working right now. Please try again.</p>}
      {current && !("failed" in current) && (current.items.length === 0
        ? <p className="search-hint">Nothing matches “{term}”. Try another word.</p>
        : <>
          <ul className="search-results">
            {current.items.map(item => <li key={item.id}>
              <Link href={productHref(item)} onClick={close}>
                <span className="cart-thumb"><ProductArt item={item} sizes="48px" /></span>
                <span className="search-result-text"><strong>{item.name}</strong><em>{item.type || shelfOf(item.category).singular}</em></span>
                <b>{item.stock === 0 ? "Sold out" : money(item.price)}</b>
              </Link>
            </li>)}
          </ul>
          <Link className="button button-primary search-all" href={resultsHref} onClick={close}>See all {current.total} {current.total === 1 ? "result" : "results"}</Link>
        </>)}
    </div>
  </dialog>;
}
