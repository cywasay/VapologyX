"use client";

import { useState } from "react";
import { Loader } from "@/components/loader/Loader";
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

  if (counter.status === "loading") return <Loader label="Opening the counter" />;
  if (counter.status === "failed") return <div className="ct-failed" role="alert">
    <p>The counter couldn&apos;t load. Check your connection, then try again.</p>
    <button className="ct-primary" onClick={counter.reload}>Try again</button>
  </div>;

  return <>
    <CounterTopBar mode={mode} onMode={setMode} counter={counter} />
    {counter.problem && <p className="ct-alert" role="alert">{counter.problem}<button className="ct-link" onClick={counter.dismissProblem}>Dismiss</button></p>}
    <main className="ct-main">
      {mode === "sell" && <SellPanel counter={counter} />}
      {mode === "refill" && <RefillPanel counter={counter} />}
      {mode === "sales" && <SalesPanel counter={counter} />}
      {mode === "closing" && <ClosingPanel counter={counter} />}
      {mode === "restock" && <RestockPanel onChanged={counter.refresh} />}
    </main>
    {counter.receipt && <ReceiptDialog key={counter.receipt.id} sale={counter.receipt} onClose={counter.closeReceipt} />}
  </>;
}
