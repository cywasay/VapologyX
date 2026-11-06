"use client";

import { useState } from "react";
import { money } from "@/lib/products";
import type { Counter } from "../useCounter";

const toNumber = (text: string) => Number(text.replace(/[,\s]/g, "")) || 0;

// The end of the day: the cash the drawer started with, what came in, cash taken out, and the count at the end.
export function ClosingPanel({ counter }: { counter: Counter }) {
  const [counted, setCounted] = useState("");
  const [outAmount, setOutAmount] = useState("");
  const [outNote, setOutNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const difference = counted.trim() === "" ? null : toNumber(counted) - counter.expectedCash;
  const rows: [string, number][] = [["Cash sales", counter.byPay("Cash")], ["Card sales", counter.byPay("Card")], ["Wallet sales", counter.byPay("Wallet")], ["Refills (cash)", counter.refillsToday]];

  return <div className="ct-closing">
    <section className="ct-card" aria-labelledby="ct-day-title">
      <h2 id="ct-day-title" className="ct-section-title">Today&apos;s money</h2>
      <dl className="ct-money">
        {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{money(value)}</dd></div>)}
        <div className="is-total"><dt>Everything taken today</dt><dd>{money(counter.byPay("Cash") + counter.byPay("Card") + counter.byPay("Wallet") + counter.refillsToday)}</dd></div>
      </dl>
      <p className="ct-note">Voided sales are not counted.</p>
    </section>

    <section className="ct-card" aria-labelledby="ct-cash-title">
      <h2 id="ct-cash-title" className="ct-section-title">Cash drawer</h2>
      <label className="ct-field">Cash in the drawer this morning
        <input inputMode="numeric" value={String(counter.opening)} onChange={event => counter.setOpening(toNumber(event.target.value))} disabled={counter.closed} />
      </label>
      <h3 className="ct-subtitle">Cash taken out</h3>
      <ul className="ct-outs">
        {counter.cashOuts.map(entry => <li key={entry.id}><span>{entry.note}</span><b>{money(entry.amount)}</b>{!counter.closed && <button className="ct-link" onClick={() => counter.removeCashOut(entry.id)}>Remove</button>}</li>)}
        {counter.cashOuts.length === 0 && <li className="ct-hint">Nothing taken out.</li>}
      </ul>
      {!counter.closed && <form className="ct-custom" onSubmit={event => { event.preventDefault(); counter.addCashOut(toNumber(outAmount), outNote); setOutAmount(""); setOutNote(""); }}>
        <input inputMode="numeric" placeholder="Rupees" aria-label="Cash out amount" value={outAmount} onChange={event => setOutAmount(event.target.value)} />
        <input placeholder="What for (tea, delivery…)" aria-label="Cash out reason" value={outNote} onChange={event => setOutNote(event.target.value)} />
        <button type="submit" className="ct-primary">Add</button>
      </form>}
      <dl className="ct-money">
        <div><dt>Cash that should be in the drawer</dt><dd>{money(counter.expectedCash)}</dd></div>
      </dl>
      <label className="ct-field">Cash you counted
        <input inputMode="numeric" placeholder="Count the drawer and type it" value={counted} onChange={event => setCounted(event.target.value)} disabled={counter.closed} />
      </label>
      {difference !== null && <p className={`ct-diff ${difference === 0 ? "is-ok" : "is-off"}`}>{difference === 0 ? "The drawer matches." : difference > 0 ? `Over by ${money(difference)}` : `Short by ${money(-difference)}`}</p>}

      {counter.closed
        ? <p className="ct-closed">The day is closed. Sales are switched off until tomorrow.</p>
        : confirming
        ? <div className="ct-confirm-row">Close the day? Sales will be switched off. <button className="ct-primary" onClick={counter.closeDay}>Yes, close the day</button><button className="ct-link" onClick={() => setConfirming(false)}>Cancel</button></div>
        : <button className="ct-complete" disabled={difference === null} onClick={() => setConfirming(true)}>{difference === null ? "Count the drawer to close" : "Close the day"}</button>}
    </section>
  </div>;
}
