"use client";

import { useState } from "react";
import type { Counter } from "../useCounter";
import type { Shelf } from "../types";
import { ItemGrid } from "./ItemGrid";
import { SalePanel } from "./SalePanel";

export function SellPanel({ counter }: { counter: Counter }) {
  const [shelf, setShelf] = useState<Shelf | "all">("all");
  const [search, setSearch] = useState("");
  return <div className="ct-sell">
    <ItemGrid counter={counter} shelf={shelf} onShelf={setShelf} search={search} onSearch={setSearch} />
    <SalePanel counter={counter} />
  </div>;
}
