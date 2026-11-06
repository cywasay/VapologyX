"use client";

import { useEffect, useRef, useState } from "react";
import { SearchGlyph } from "@/components/art";

// How long to wait after typing stops before the results change.
const WAIT = 350;
const clean = (text: string) => text.replace(/\s+/g, " ").trim();

// The search box of the search page. Results follow once typing stops, or at once on Enter.
export function ShelfSearchField({ value, onChange }: { value: string; onChange: (text: string) => void }) {
  const [seen, setSeen] = useState(value);
  const [draft, setDraft] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(value);
  }
  const latest = useRef(onChange);
  useEffect(() => { latest.current = onChange; });

  useEffect(() => {
    const next = clean(draft);
    if (next === value) return;
    const timer = setTimeout(() => latest.current(next), WAIT);
    return () => clearTimeout(timer);
  }, [draft, value]);

  return <form className="search-field" role="search" onSubmit={event => { event.preventDefault(); onChange(clean(draft)); }}>
    <SearchGlyph />
    <input type="search" value={draft} placeholder="Search devices, bottles, coils" aria-label="Search products" autoComplete="off" enterKeyHint="search" maxLength={80} autoFocus={!value} onChange={event => setDraft(event.target.value)} />
  </form>;
}
