import { money } from "@/lib/products";
import type { Counter } from "../useCounter";
import type { Pay } from "../types";
import { CashGiven } from "./CashGiven";

const payments: Pay[] = ["Cash", "Card", "Wallet"];

// The sale being rung up: its items, the total, how it is paid and the Complete sale button.
export function SalePanel({ counter }: { counter: Counter }) {
  return <aside className="ct-sale" aria-label="Current sale">
    <div className="ct-sale-head"><h2>Current sale</h2>{counter.lines.length > 0 && <button className="ct-link" onClick={counter.clearSale}>Clear</button>}</div>
    <ul className="ct-lines">
      {counter.lines.map(({ item, quantity }) => <li key={item.id}>
        <span className="ct-line-name">{item.name}</span>
        <span className="ct-step">
          <button onClick={() => counter.setQuantity(item.id, quantity - 1)} aria-label={`Remove one ${item.name}`}>−</button>
          <b>{quantity}</b>
          <button onClick={() => counter.setQuantity(item.id, quantity + 1)} disabled={quantity >= item.stock} aria-label={`Add one ${item.name}`}>+</button>
        </span>
        <strong>{money(item.price * quantity)}</strong>
      </li>)}
      {counter.lines.length === 0 && <li className="ct-hint">Tap an item or scan a barcode to start a sale.</li>}
    </ul>
    <div className="ct-total"><span>Total</span><strong>{money(counter.total)}</strong></div>
    <div className="ct-pay" role="group" aria-label="Payment">
      {payments.map(method => <button key={method} className={counter.pay === method ? "is-current" : ""} aria-pressed={counter.pay === method} onClick={() => counter.setPay(method)}>{method}</button>)}
    </div>
    {counter.pay === "Cash" && <CashGiven counter={counter} />}
    <button className="ct-complete" onClick={counter.completeSale} disabled={counter.closed}>{counter.closed ? "Day is closed" : "Complete sale"}</button>
    <p className="ct-note" role="status">{counter.note}</p>
  </aside>;
}
