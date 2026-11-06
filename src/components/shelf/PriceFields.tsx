"use client";

import { useEffect, useRef, useState } from "react";
import { whole } from "@/lib/product-query";

// How long to wait after typing stops before the results change.
const WAIT = 450;
const asText = (value: number | null) => value === null ? "" : String(value);

// Two boxes for the lowest and highest price. The results follow once typing stops.
export function PriceFields({ min, max, onChange }: { min: number | null; max: number | null; onChange: (min: number | null, max: number | null) => void }) {
  const shown = `${asText(min)}|${asText(max)}`;
  const [seen, setSeen] = useState(shown);
  const [draft, setDraft] = useState({ min: asText(min), max: asText(max) });
  // When the address changes on its own (Clear filters, Back), the boxes follow it.
  if (seen !== shown) {
    setSeen(shown);
    setDraft({ min: asText(min), max: asText(max) });
  }
  const latest = useRef(onChange);
  useEffect(() => { latest.current = onChange; });

  useEffect(() => {
    const nextMin = whole(draft.min);
    const nextMax = whole(draft.max);
    if (nextMin === min && nextMax === max) return;
    const timer = setTimeout(() => latest.current(nextMin, nextMax), WAIT);
    return () => clearTimeout(timer);
  }, [draft, min, max]);

  return <fieldset className="shelf-price">
    <legend className="sr-only">Price in rupees</legend>
    <span aria-hidden="true">Price Rs</span>
    <input inputMode="numeric" placeholder="Min" aria-label="Lowest price in rupees" value={draft.min} onChange={event => setDraft({ ...draft, min: event.target.value })} />
    <span aria-hidden="true">to</span>
    <input inputMode="numeric" placeholder="Max" aria-label="Highest price in rupees" value={draft.max} onChange={event => setDraft({ ...draft, max: event.target.value })} />
  </fieldset>;
}
