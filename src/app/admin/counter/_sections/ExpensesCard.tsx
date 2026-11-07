"use client";

import { useState } from "react";
import { Select } from "@/components/dropdown";
import { money } from "@/lib/products";
import type { Counter } from "../useCounter";
import { EXPENSE_KINDS, type ExpenseKind } from "../types";

const toNumber = (text: string) => Number(text.replace(/[,\s]/g, "")) || 0;

// Money spent today on food, tea, shipping, tax and so on. It comes off the month's profit. If it was paid with cash from
// the till it also lowers the cash the drawer should hold.
export function ExpensesCard({ counter }: { counter: Counter }) {
  const [kind, setKind] = useState<ExpenseKind>("Tea");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [fromDrawer, setFromDrawer] = useState(true);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (await counter.addExpense(kind, toNumber(amount), note, fromDrawer)) {
      setAmount("");
      setNote("");
    }
  }

  return <section className="ct-card" aria-labelledby="ct-expenses-title">
    <h2 id="ct-expenses-title" className="ct-section-title">Expenses today <small>{money(counter.expensesTotal)}</small></h2>
    <ul className="ct-outs">
      {counter.expenses.map(entry => <li key={entry.id}>
        <span>{entry.kind}{entry.note ? ` · ${entry.note}` : ""}<small>{entry.fromDrawer ? "paid from the drawer" : "not from the drawer"}</small></span>
        <b>{money(entry.amount)}</b>
        {!counter.locked && <button className="ct-link" onClick={() => counter.removeExpense(entry.id)}>Remove</button>}
      </li>)}
      {counter.expenses.length === 0 && <li className="ct-hint">No expenses today.</li>}
    </ul>
    {!counter.locked && <form className="ct-expense-form" onSubmit={add}>
      <Select variant="pill" value={kind} options={EXPENSE_KINDS.map(item => ({ value: item, label: item }))} onChange={next => setKind(next as ExpenseKind)} aria-label="What the expense was for" />
      <input inputMode="numeric" placeholder="Rupees" aria-label="Expense amount" value={amount} onChange={event => setAmount(event.target.value)} />
      <input placeholder="Note (optional)" maxLength={120} aria-label="Expense note" value={note} onChange={event => setNote(event.target.value)} />
      <label className="ct-check"><input type="checkbox" checked={fromDrawer} onChange={event => setFromDrawer(event.target.checked)} />Paid with cash from the drawer</label>
      <button type="submit" className="ct-primary" disabled={counter.busy}>Add expense</button>
    </form>}
  </section>;
}
