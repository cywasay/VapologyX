import { money } from "@/lib/products";
import type { Counter } from "../useCounter";

// What the shop actually kept for this sale, after giving back any change. Works the same for Cash, Bank and Wallet.
// Less than the bill is recorded as a discount, more as extra charged. Left empty, the sale is at the full bill.
export function Received({ counter }: { counter: Counter }) {
  const { adjustment } = counter;
  return <div className="ct-cash">
    <div className="ct-cash-row">
      <input inputMode="numeric" placeholder={`Received (${money(counter.total)})`} aria-label="Amount received" value={counter.received} onChange={event => counter.setReceived(event.target.value)} />
      {counter.received !== "" && <button onClick={() => counter.setReceived("")}>Full price</button>}
    </div>
    {adjustment !== 0 && <p className={adjustment < 0 ? "ct-change is-short" : "ct-change"}>{adjustment < 0 ? `Discount: ${money(-adjustment)}` : `Extra charged: ${money(adjustment)}`}</p>}
  </div>;
}
