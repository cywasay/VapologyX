"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { LOYALTY, points, type LoyaltyChannel } from "@/lib/loyalty";
import { money } from "@/lib/products";
import { loyaltyApi, type Entry, type MemberDetail } from "./loyaltyApi";

const KIND: Record<Entry["kind"], string> = { earn: "Earned", redeem: "Used", adjust: "Changed by admin", reverse: "Undone" };

// One member: name, both balances, a by-hand correction (admin only, reason required) and the full history.
export function CustomerDialog({ id, channel, onClose, onChanged }: { id: string; channel: LoyaltyChannel; onClose: () => void; onChanged: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [tab, setTab] = useState<LoyaltyChannel>(channel);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    let stale = false;
    loyaltyApi.member(id).then(reply => {
      if (stale) return;
      if (reply.ok) { setMember(reply.data); setName(reply.data.name); } else setStatus({ kind: "error", text: reply.error });
    });
    return () => { stale = true; };
  }, [id]);

  async function adjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount.replace(/[,\s+]/g, ""));
    if (!Number.isInteger(value) || value === 0) return setStatus({ kind: "error", text: "Type a whole number of points, like 500 to add or -200 to take away." });
    setBusy(true);
    const reply = await loyaltyApi.adjust(id, tab, value, reason);
    setBusy(false);
    if (!reply.ok) return setStatus({ kind: "error", text: reply.error });
    setMember(reply.data);
    setAmount("");
    setReason("");
    setStatus({ kind: "success", text: `${value > 0 ? "Added" : "Took away"} ${points(Math.abs(value))} (${tab}).` });
    onChanged();
  }

  async function saveName() {
    if (!member || name.trim() === member.name) return;
    const reply = await loyaltyApi.rename(id, name);
    if (reply.ok) { setMember({ ...member, name: name.trim() }); onChanged(); }
  }

  const entries = member?.entries.filter(entry => entry.channel === tab) ?? [];
  const balance = member ? member[tab].balance : 0;
  return <dialog ref={dialog} className="product-form" aria-labelledby="customer-title" onClose={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="product-form-top">
      <h2 id="customer-title">{member ? member.phone : "Customer"}</h2>
      <button type="button" className="cart-close" aria-label="Close" onClick={() => dialog.current?.close()}>×</button>
    </div>
    <div className="product-form-body">
      {!member && !status && <p className="admin-note">Loading…</p>}
      {member && <>
        <section className="product-form-group">
          <label className="field">Name<input value={name} maxLength={120} placeholder="No name" onChange={event => setName(event.target.value)} onBlur={saveName} /></label>
          <div className="loyalty-balances">
            {(["shop", "online"] as const).map(key => <button key={key} type="button" className={tab === key ? "is-current" : ""} aria-pressed={tab === key} onClick={() => setTab(key)}>
              <span>{key === "shop" ? "Shop points" : "Online points"}</span>
              <strong>{member[key].balance.toLocaleString("en-US")}</strong>
              <small>{member[key].member ? `Worth ${money(member[key].balance * LOYALTY.pointValue)}` : "Not a member here yet"}</small>
            </button>)}
          </div>
        </section>

        <section className="product-form-group">
          <h3 className="admin-subtitle">Correct {tab} points</h3>
          <form className="loyalty-adjust" onSubmit={adjust}>
            <label className="field">Points (+ to add, − to take away)<input inputMode="numeric" placeholder="e.g. 500 or -200" value={amount} onChange={event => setAmount(event.target.value)} disabled={busy} /></label>
            <label className="field">Reason (required)<input value={reason} maxLength={300} placeholder="e.g. Points missed on sale #42" onChange={event => setReason(event.target.value)} disabled={busy} /></label>
            <button className="button button-black" type="submit" disabled={busy}>{busy ? "Saving…" : "Save change"}</button>
          </form>
          {status && <p className={`form-status is-${status.kind}`} role="status">{status.text}</p>}
        </section>

        <section className="product-form-group">
          <h3 className="admin-subtitle">{tab === "shop" ? "Shop" : "Online"} history · balance {points(balance)}</h3>
          {entries.length === 0 && <p className="admin-note">Nothing yet.</p>}
          <ul className="loyalty-history">
            {entries.map(entry => <li key={entry.id}>
              <div><b>{KIND[entry.kind]}</b><small>{entry.note || "–"} · {entry.date}</small>
                {entry.points > 0 && entry.expires && <small className={entry.expired ? "is-expired" : ""}>{entry.expired ? `${points(entry.remaining)} expired on ${entry.expires}` : entry.remaining > 0 ? `${points(entry.remaining)} left, expire ${entry.expires}` : "All used"}</small>}
              </div>
              <strong className={entry.points > 0 ? "is-plus" : "is-minus"}>{entry.points > 0 ? "+" : "−"}{Math.abs(entry.points).toLocaleString("en-US")}</strong>
            </li>)}
          </ul>
        </section>
      </>}
    </div>
    <div className="product-form-foot">
      <p className="form-status is-error" role="alert">{!member && status ? status.text : ""}</p>
      <div><button type="button" className="button button-outline" onClick={() => dialog.current?.close()}>Close</button></div>
    </div>
  </dialog>;
}
