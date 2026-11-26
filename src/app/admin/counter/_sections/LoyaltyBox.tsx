import { LOYALTY, points } from "@/lib/loyalty";
import { money } from "@/lib/products";
import type { Counter } from "../useCounter";

// Loyalty Club at the till. Optional: staff ask "Do you want to collect points?" and type the customer's mobile.
// A known number shows the name and shop balance, and points can be used (1,000+ needed, at most 20% of the bill).
export function LoyaltyBox({ counter }: { counter: Counter }) {
  const { member } = counter;
  return <div className="ct-loyalty">
    <div className="ct-loyalty-head"><b>{LOYALTY.name}</b>{counter.phone && <button className="ct-link" onClick={() => counter.setPhone("")}>Remove</button>}</div>
    <input inputMode="tel" placeholder="Customer mobile (optional)" aria-label="Customer mobile for loyalty points" value={counter.phone} onChange={event => counter.setPhone(event.target.value)} maxLength={16} />
    {counter.lookingUp && <p className="ct-loyalty-note">Looking up…</p>}
    {member && !member.found && <>
      <p className="ct-loyalty-note">New member. Points start with this sale.</p>
      <input placeholder="Name (optional)" aria-label="New member name" value={counter.memberName} onChange={event => counter.setMemberName(event.target.value)} maxLength={120} />
    </>}
    {member?.found && <p className="ct-loyalty-note"><strong>{member.name || "Member"}</strong> · {points(member.shop)} in the shop</p>}
    {member && counter.pointsMax > 0 && <div className="ct-cash-row">
      <input inputMode="numeric" placeholder={`Use points (up to ${counter.pointsMax.toLocaleString("en-US")})`} aria-label="Points to use" value={counter.pointsText} onChange={event => counter.setPoints(event.target.value)} />
      <button onClick={() => counter.setPoints(String(counter.pointsMax))}>Use max</button>
    </div>}
    {member?.found && member.shop > 0 && member.shop < LOYALTY.minToUse && <p className="ct-loyalty-note">Points can be used from {LOYALTY.minToUse.toLocaleString("en-US")}.</p>}
    {!counter.pointsValid && <p className="ct-change is-short">Use between 0 and {counter.pointsMax.toLocaleString("en-US")} points.</p>}
    {member && <p className="ct-loyalty-earn">{counter.pointsToEarn > 0 ? `Earns ${points(counter.pointsToEarn)} on this bill` : "This bill earns no points (discounted or sale items only)."}{counter.pointsUsed > 0 && ` · ${money(counter.pointsUsed * LOYALTY.pointValue)} off with points`}</p>}
  </div>;
}
