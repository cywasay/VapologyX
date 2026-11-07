import { money } from "@/lib/products";
import { earnedFrom } from "../useCounter";
import type { Bottle } from "../types";

// A bottle staff have finished. Only now is the cost compared with what it earned.
export function FinishedBottleCard({ bottle }: { bottle: Bottle }) {
  const earned = earnedFrom(bottle);
  const cost = bottle.cost ?? 0;
  const difference = earned - cost;
  return <article className="ct-bottle is-finished">
    <header><h3>{bottle.flavor}</h3><span>finished</span></header>
    <dl>
      <div><dt>Earned from refills</dt><dd>{money(earned)}</dd></div>
      <div><dt>Bottle cost</dt><dd>{money(Math.round(cost))}</dd></div>
      <div className={difference >= 0 ? "is-profit" : "is-loss"}><dt>{difference >= 0 ? "Profit" : "Loss"}</dt><dd>{money(Math.round(Math.abs(difference)))}</dd></div>
    </dl>
  </article>;
}
