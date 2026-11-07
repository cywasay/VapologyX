"use client";

import { useEffect, useState } from "react";
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
  // Dark mode for long days at the till. Remembered on this device only.
  const [dark, setDark] = useState(() => { try { return localStorage.getItem("vx-counter-dark") === "1"; } catch { return false; } });
  useEffect(() => {
    const frame = document.querySelector(".ct");
    frame?.classList.toggle("is-dark", dark);
    try { localStorage.setItem("vx-counter-dark", dark ? "1" : "0"); } catch {}
    return () => frame?.classList.remove("is-dark");
  }, [dark]);
  // Full screen for the till, where the browser allows it. null means this browser can't, so the button is hidden.
  const [full, setFull] = useState<boolean | null>(null);
  useEffect(() => {
    if (!document.fullscreenEnabled) return;
    const sync = () => setFull(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFull = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen().catch(() => undefined); };

  if (counter.status === "loading") return <Loader label="Opening the counter" />;
  if (counter.status === "failed") return <div className="ct-failed" role="alert">
    <p>The counter couldn&apos;t load. Check your connection, then try again.</p>
    <button className="ct-primary" onClick={counter.reload}>Try again</button>
  </div>;

  return <>
    <CounterTopBar mode={mode} onMode={setMode} counter={counter} dark={dark} onDark={() => setDark(value => !value)} full={full} onFull={toggleFull} />
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
