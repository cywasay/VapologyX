"use client";

import { useState } from "react";
import { money } from "@/lib/products";
import type { Counter } from "../useCounter";
import { ExpensesCard } from "./ExpensesCard";

const toNumber = (text: string) => Number(text.replace(/[,\s]/g, "")) || 0;

// The end of the day: the cash the drawer started with, what came in, cash taken out, and the count at the end.
export function ClosingPanel({ counter }: { counter: Counter }) {
  const [counted, setCounted] = useState("");
  const [outAmount, setOutAmount] = useState("");
  const [outNote, setOutNote] = useState("");
  const [confirming, setConfirming] = useState<"close" | "lock" | null>(null);
  const difference = counted.trim() === "" ? null : toNumber(counted) - counter.expectedCash;
  const rows: [string, number][] = [["Cash sales", counter.byPay("Cash")], ["Bank sales", counter.byPay("Bank")], ["Wallet sales", counter.byPay("Wallet")], ["Refills (cash)", counter.refillsToday]];

  return <div className="ct-closing">
    <section className="ct-card" aria-labelledby="ct-day-title">
      <h2 id="ct-day-title" className="ct-section-title">Today&apos;s money</h2>
      <dl className="ct-money">
        {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{money(value)}</dd></div>)}
        <div className="is-total"><dt>Everything taken today</dt><dd>{money(counter.byPay("Cash") + counter.byPay("Bank") + counter.byPay("Wallet") + counter.refillsToday)}</dd></div>
      </dl>
      <p className="ct-note">Voided sales are not counted.</p>
    </section>

    <section className="ct-card" aria-labelledby="ct-cash-title">
      <h2 id="ct-cash-title" className="ct-section-title">Cash drawer</h2>
      <label className="ct-field">Cash in the drawer this morning
        <input inputMode="numeric" value={String(counter.opening)} onChange={event => counter.setOpening(toNumber(event.target.value))} onBlur={counter.saveOpening} disabled={counter.locked} />
      </label>
      <h3 className="ct-subtitle">Cash taken out</h3>
      <ul className="ct-outs">
        {counter.cashOuts.map(entry => <li key={entry.id}><span>{entry.note}</span><b>{money(entry.amount)}</b>{!counter.locked && <button className="ct-link" onClick={() => counter.removeCashOut(entry.id)}>Remove</button>}</li>)}
        {counter.cashOuts.length === 0 && <li className="ct-hint">Nothing taken out.</li>}
      </ul>
      {!counter.locked && <form className="ct-custom" onSubmit={event => { event.preventDefault(); counter.addCashOut(toNumber(outAmount), outNote); setOutAmount(""); setOutNote(""); }}>
        <input inputMode="numeric" placeholder="Rupees" aria-label="Cash out amount" value={outAmount} onChange={event => setOutAmount(event.target.value)} />
        <input placeholder="What for (tea, delivery…)" aria-label="Cash out reason" value={outNote} onChange={event => setOutNote(event.target.value)} />
        <button type="submit" className="ct-primary">Add</button>
      </form>}
      <dl className="ct-money">
        {counter.drawerExpensesTotal > 0 && <div><dt>Expenses paid from the drawer</dt><dd>−{money(counter.drawerExpensesTotal)}</dd></div>}
        <div><dt>Cash that should be in the drawer</dt><dd>{money(counter.expectedCash)}</dd></div>
      </dl>
      <label className="ct-field">Cash you counted
        <input inputMode="numeric" placeholder="Count the drawer and type it" value={counted} onChange={event => setCounted(event.target.value)} disabled={counter.locked} />
      </label>
      {difference !== null && <p className={`ct-diff ${difference === 0 ? "is-ok" : "is-off"}`}>{difference === 0 ? "The drawer matches." : difference > 0 ? `Over by ${money(difference)}` : `Short by ${money(-difference)}`}</p>}

      {counter.closed && <p className="ct-closed">{counter.locked ? "Today is closed and locked. Nothing can change." : "Today is closed. You can still fix mistakes, then close again to update it."} {counter.closing ? `You counted ${money(counter.closing.counted)} against ${money(counter.closing.expected)} expected${counter.closing.difference === 0 ? ", a match." : counter.closing.difference > 0 ? `, over by ${money(counter.closing.difference)}.` : `, short by ${money(-counter.closing.difference)}.`}` : ""}</p>}
      {!counter.locked && (confirming === "close"
        ? <div className="ct-confirm-row">{counter.closed ? "Close the day again with this count?" : "Close the day?"} <button className="ct-primary" onClick={() => { counter.closeDay(toNumber(counted)); setConfirming(null); }}>Yes, close the day</button><button className="ct-link" onClick={() => setConfirming(null)}>Cancel</button></div>
        : confirming === "lock"
        ? <div className="ct-confirm-row">Lock today forever? It can never be changed again. <button className="ct-primary" onClick={() => { counter.lockDay(); setConfirming(null); }}>Yes, lock it</button><button className="ct-link" onClick={() => setConfirming(null)}>Cancel</button></div>
        : <div className="ct-confirm-row">
            <button className="ct-complete" disabled={difference === null} onClick={() => setConfirming("close")}>{difference === null ? "Count the drawer to close" : counter.closed ? "Close again" : "Close the day"}</button>
            {counter.closed && <button className="ct-link" onClick={() => setConfirming("lock")}>Lock today</button>}
          </div>)}
    </section>

    <ExpensesCard counter={counter} />
  </div>;
}
