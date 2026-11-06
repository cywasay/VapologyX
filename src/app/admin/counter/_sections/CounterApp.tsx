"use client";

import { useState } from "react";
import type { Mode } from "../types";
import { useCounter } from "../useCounter";
import { ClosingPanel } from "./ClosingPanel";
import { CounterTopBar } from "./CounterTopBar";
import { ReceiptDialog } from "./ReceiptDialog";
import { RefillPanel } from "./RefillPanel";
import { RestockPanel } from "./RestockPanel";
import { SalesPanel } from "./SalesPanel";
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
      {mode === "sales" && <SalesPanel counter={counter} />}
      {mode === "closing" && <ClosingPanel counter={counter} />}
      {mode === "restock" && <RestockPanel />}
    </main>
    {counter.receipt && <ReceiptDialog key={counter.receipt.id} sale={counter.receipt} onClose={counter.closeReceipt} />}
  </>;
}
