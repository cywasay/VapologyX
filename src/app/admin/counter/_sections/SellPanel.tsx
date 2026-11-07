"use client";

import { useState } from "react";
import type { Counter } from "../useCounter";
import type { Shelf } from "../types";
import { ItemGrid } from "./ItemGrid";
import { money } from "@/lib/products";
import { SalePanel } from "./SalePanel";

export function SellPanel({ counter }: { counter: Counter }) {
  const [shelf, setShelf] = useState<Shelf | "all">("all");
  const [search, setSearch] = useState("");
  return <div className="ct-sell">
    <ItemGrid counter={counter} shelf={shelf} onShelf={setShelf} search={search} onSearch={setSearch} />
    <SalePanel counter={counter} />
    {counter.lines.length > 0 && <a className="ct-jump" href="#ct-sale-panel">Current sale · {counter.lines.reduce((sum, line) => sum + line.quantity, 0)} items · {money(counter.total)}</a>}
  </div>;
}
