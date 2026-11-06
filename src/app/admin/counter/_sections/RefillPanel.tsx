import { money } from "@/lib/products";
import type { Counter } from "../useCounter";
import { FinishedBottleCard } from "./FinishedBottleCard";
import { OpenBottleBar } from "./OpenBottleBar";
import { OpenBottleCard } from "./OpenBottleCard";

export function RefillPanel({ counter }: { counter: Counter }) {
  const open = counter.bottles.filter(bottle => !bottle.finished);
  const finished = counter.bottles.filter(bottle => bottle.finished);
  return <div className="ct-refill">
    <OpenBottleBar counter={counter} />
    <section aria-labelledby="ct-open-title">
      <h2 id="ct-open-title" className="ct-section-title">Open bottles <small>{open.length}</small></h2>
      <div className="ct-bottles">
        {open.map(bottle => <OpenBottleCard key={bottle.id} bottle={bottle} counter={counter} />)}
        {open.length === 0 && <p className="ct-empty">No bottles are open. Open one above.</p>}
      </div>
    </section>
    <section aria-labelledby="ct-done-title">
      <h2 id="ct-done-title" className="ct-section-title">Finished bottles <small>{money(counter.refillsAll)} earned from all refills</small></h2>
      <div className="ct-bottles">
        {finished.map(bottle => <FinishedBottleCard key={bottle.id} bottle={bottle} />)}
        {finished.length === 0 && <p className="ct-empty">Finished bottles show their profit here.</p>}
      </div>
    </section>
  </div>;
}
