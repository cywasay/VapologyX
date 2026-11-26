"use client";

import { useEffect, useState, type FormEvent } from "react";
import { refreshSettings } from "@/lib/settings-actions";
import { createClient } from "@/utils/supabase/client";
import { StatusLine, type Status } from "../../_shared/StatusLine";

const toNumber = (text: string) => Number(text.replace(/[,\s]/g, ""));

// The delivery fee customers pay, and the order total from which the shop pays delivery instead.
// The shop pages, checkout and the database (place_order) all read these same two numbers.
export function DeliveryCard() {
  const [fee, setFee] = useState("");
  const [freeFrom, setFreeFrom] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let stale = false;
    createClient().from("store_settings").select("delivery_fee, free_delivery_from").eq("id", 1).maybeSingle().then(({ data, error }) => {
      if (stale) return;
      if (error || !data) { setStatus({ kind: "error", text: "We couldn't load the delivery settings. Please refresh the page." }); return; }
      setFee(String(data.delivery_fee));
      setFreeFrom(String(data.free_delivery_from));
      setLoaded(true);
    });
    return () => { stale = true; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const feeValue = toNumber(fee);
    const limitValue = toNumber(freeFrom);
    if (!Number.isInteger(feeValue) || feeValue < 0 || feeValue > 100000) return setStatus({ kind: "error", text: "Type the delivery fee in whole rupees." });
    if (!Number.isInteger(limitValue) || limitValue < 1) return setStatus({ kind: "error", text: "Type the free delivery amount in whole rupees." });
    setBusy(true);
    setStatus(null);
    const { error } = await createClient().rpc("store_settings_save", { p_delivery_fee: feeValue, p_free_delivery_from: limitValue });
    if (error) { setBusy(false); return setStatus({ kind: "error", text: "The delivery settings couldn't be saved. Please try again." }); }
    const refreshed = await refreshSettings().catch(() => ({ ok: false }));
    setBusy(false);
    setStatus(refreshed.ok
      ? { kind: "success", text: "Saved. The shop and checkout use the new amounts now." }
      : { kind: "info", text: "Saved. The shop pages may take a while to show the new amounts." });
  }

  return <section className="admin-card settings-card" aria-labelledby="delivery-title">
    <h2 id="delivery-title">Delivery</h2>
    <form className="settings-form" onSubmit={submit}>
      <label className="field">Delivery fee the customer pays (Rs)
        <input inputMode="numeric" value={fee} disabled={!loaded} onChange={event => setFee(event.target.value)} />
      </label>
      <label className="field">Free delivery from an order of (Rs)
        <input inputMode="numeric" value={freeFrom} disabled={!loaded} onChange={event => setFreeFrom(event.target.value)} />
        <span className="field-hint">From this amount the shop pays delivery. Enter what you pay the courier as a &quot;Ship&quot; expense at the counter.</span>
      </label>
      <button className="button button-black" type="submit" disabled={busy || !loaded}>{busy ? "Saving…" : "Save delivery settings"}</button>
    </form>
    <StatusLine status={status} />
  </section>;
}
