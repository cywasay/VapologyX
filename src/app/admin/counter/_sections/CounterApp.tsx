"use client";

import { useState } from "react";
import type { Mode } from "../types";
import { useCounter } from "../useCounter";
import { CounterTopBar } from "./CounterTopBar";
import { RefillPanel } from "./RefillPanel";
import { RestockPanel } from "./RestockPanel";
import { SellPanel } from "./SellPanel";

// The whole counter screen. Staff stay in one mode at a time and switch with the big buttons at the top.
export function CounterApp() {
  const [mode, setMode] = useState<Mode>("sell");
  const counter = useCounter();
  return <>
    <CounterTopBar mode={mode} onMode={setMode} counter={counter} />
    <main className="ct-main">
      {mode === "sell" && <SellPanel counter={counter} />}
      {mode === "refill" && <RefillPanel counter={counter} />}
      {mode === "restock" && <RestockPanel />}
    </main>
  </>;
}
