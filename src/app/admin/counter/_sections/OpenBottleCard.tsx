"use client";

import { useState } from "react";
import { money } from "@/lib/products";
import { earnedFrom, type Counter } from "../useCounter";
import type { Bottle } from "../types";

const QUICK = [100, 200, 300, 500];

// A bottle that is open now. It shows only what has been earned from it, never its cost or profit.
export function OpenBottleCard({ bottle, counter }: { bottle: Bottle; counter: Counter }) {
  const [custom, setCustom] = useState("");
  const [confirming, setConfirming] = useState(false);

  function addCustom() {
    const amount = Number(custom.replace(/[,\s]/g, ""));
    if (Number.isInteger(amount) && amount > 0) {
      counter.addRefill(bottle.id, amount);
      setCustom("");
    }
  }

  return <article className="ct-bottle">
    <header><h3>{bottle.flavor}</h3><span>opened {bottle.openedOn}</span></header>
    <p className="ct-earned"><strong>{money(earnedFrom(bottle))}</strong><span>earned so far, {bottle.entries.length} refills</span></p>
    <div className="ct-quick">
      {QUICK.map(amount => <button key={amount} onClick={() => counter.addRefill(bottle.id, amount)}>+{amount}</button>)}
    </div>
    <form className="ct-custom" onSubmit={event => { event.preventDefault(); addCustom(); }}>
      <input inputMode="numeric" placeholder="Other rupees" aria-label={`Other refill amount for ${bottle.flavor}`} value={custom} onChange={event => setCustom(event.target.value)} />
      <button type="submit" className="ct-primary">Add</button>
    </form>
    <footer>
      <button className="ct-link" disabled={bottle.entries.length === 0} onClick={() => counter.undoRefill(bottle.id)}>Undo last refill</button>
      {confirming
        ? <span className="ct-confirm">Finish this bottle? <button className="ct-link" onClick={() => counter.finishBottle(bottle.id)}>Yes, finish</button><button className="ct-link" onClick={() => setConfirming(false)}>Cancel</button></span>
        : <button className="ct-link" onClick={() => setConfirming(true)}>Finish bottle</button>}
    </footer>
  </article>;
}
