import { money } from "@/lib/products";
import type { Counter } from "../useCounter";

// For cash sales: how much the customer handed over, and the change to give back.
export function CashGiven({ counter }: { counter: Counter }) {
  const quick = [counter.total, 500, 1000, 5000].filter((amount, index, all) => amount > 0 && all.indexOf(amount) === index);
  return <div className="ct-cash">
    <div className="ct-cash-row">
      <input inputMode="numeric" placeholder="Cash given" aria-label="Cash given" value={counter.given} onChange={event => counter.setGiven(event.target.value)} />
      {quick.map((amount, index) => <button key={amount} onClick={() => counter.setGiven(String(amount))}>{index === 0 && amount === counter.total ? "Exact" : amount}</button>)}
    </div>
    {counter.change !== null && <p className={counter.change < 0 ? "ct-change is-short" : "ct-change"}>{counter.change < 0 ? `Short by ${money(-counter.change)}` : `Change to give: ${money(counter.change)}`}</p>}
  </div>;
}
