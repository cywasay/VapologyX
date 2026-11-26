"use client";

import { useEffect, useState } from "react";
import { LOYALTY, maxPointsFor, points, pointsFor } from "@/lib/loyalty";
import { money } from "@/lib/products";
import { createClient } from "@/utils/supabase/client";
import type { AdminOrder } from "./useOrderList";

const friendly = (message: string) =>
  message.includes("points_minimum") ? `Points can be used once the customer has ${LOYALTY.minToUse.toLocaleString("en-US")} or more.`
  : message.includes("points_limit") ? "Points can pay at most 20% of the items."
  : message.includes("points_balance") ? "The customer doesn't have that many points."
  : message.includes("order_locked") ? "Points can only be changed before the order is shipped."
  : "The points couldn't be saved. Please try again.";

// Loyalty Club on an online order. Staff use points while confirming the order on WhatsApp (before it ships).
// Points are earned automatically when the order is marked Delivered.
export function OrderPoints({ order, onChanged }: { order: AdminOrder; onChanged: (message: string) => void }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [text, setText] = useState(order.points_used > 0 ? String(order.points_used) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const open = order.status === "placed" || order.status === "confirmed";

  useEffect(() => {
    let stale = false;
    createClient().rpc("loyalty_lookup", { p_phone: order.customer_phone }).then(({ data }) => {
      if (!stale && data) setBalance((data as { online: number }).online);
    });
    return () => { stale = true; };
  }, [order.customer_phone]);

  // Points already on this order would come back first, so they count towards what can be used.
  const available = (balance ?? 0) + order.points_used;
  const max = maxPointsFor(order.subtotal, available);
  const earns = pointsFor((order.points_base ?? 0) - order.points_used);

  async function apply(value: number) {
    setBusy(true);
    setError("");
    const { error: callError } = await createClient().rpc("order_apply_points", { p_order: order.id, p_points: value });
    setBusy(false);
    if (callError) return setError(friendly(callError.message));
    onChanged(value > 0 ? `Order ${order.number}: ${points(value)} used (${money(value * LOYALTY.pointValue)} off).` : `Order ${order.number}: points removed.`);
  }

  return <section className="product-form-group order-points">
    <h3 className="admin-subtitle">{LOYALTY.name}</h3>
    <dl className="detail-list">
      <div><dt>Online balance</dt><dd>{balance === null ? "…" : points(balance)}</dd></div>
      {order.points_used > 0 && <div><dt>Used on this order</dt><dd>{points(order.points_used)} (−{money(order.points_used * LOYALTY.pointValue)})</dd></div>}
      <div><dt>{order.status === "delivered" ? "Earned" : "Earns when delivered"}</dt><dd>{points(order.status === "delivered" ? order.points_earned : earns)}</dd></div>
    </dl>
    {open && max > 0 && <div className="order-points-use">
      <input inputMode="numeric" placeholder={`Points to use (up to ${max.toLocaleString("en-US")})`} aria-label="Points to use" value={text} onChange={event => setText(event.target.value)} disabled={busy} />
      <button type="button" className="button button-white" disabled={busy} onClick={() => setText(String(max))}>Max</button>
      <button type="button" className="button button-black" disabled={busy} onClick={() => {
        const value = text.trim() === "" ? 0 : Number(text.replace(/[,\s]/g, ""));
        if (!Number.isInteger(value) || value < 0 || value > max) return setError(`Use between 0 and ${max.toLocaleString("en-US")} points.`);
        void apply(value);
      }}>{busy ? "Saving…" : "Apply points"}</button>
    </div>}
    {open && order.points_used > 0 && <button type="button" className="admin-link-button" disabled={busy} onClick={() => apply(0)}>Remove points from this order</button>}
    {open && max === 0 && balance !== null && <p className="admin-note">Points can be used from {LOYALTY.minToUse.toLocaleString("en-US")}, up to 20% of the items.</p>}
    {error && <p className="form-status is-error" role="alert">{error}</p>}
  </section>;
}
