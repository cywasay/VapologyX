"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { money } from "@/lib/products";
import { closingApi, type Asset } from "./closingApi";

// Fixed assets (furniture, panaflex…). Each keeps the value typed in. Their total goes into the match check.
export function AssetsCard({ onChanged }: { onChanged: () => void }) {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const reply = await closingApi.assets();
    if (reply.ok) setAssets(reply.data); else setStatus(reply.error);
  }, []);
  useEffect(() => {
    let stale = false;
    closingApi.assets().then(reply => { if (!stale) { if (reply.ok) setAssets(reply.data); else setStatus(reply.error); } });
    return () => { stale = true; };
  }, []);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(value.replace(/[,\s]/g, ""));
    if (!name.trim() || !Number.isInteger(amount) || amount < 0) return setStatus("Type a name and a value in whole rupees.");
    const reply = await closingApi.addAsset(name.trim(), amount);
    if (!reply.ok) return setStatus(reply.error);
    setName(""); setValue(""); setStatus("");
    await load(); onChanged();
  }

  async function remove(asset: Asset) {
    const reply = await closingApi.removeAsset(asset.id);
    if (!reply.ok) return setStatus(reply.error);
    await load(); onChanged();
  }

  const total = (assets ?? []).reduce((sum, asset) => sum + asset.value, 0);
  return <section className="admin-card cl-card" aria-labelledby="cl-assets">
    <h2 id="cl-assets" className="cl-title">Fixed assets</h2>
    <ul className="cl-list">
      {(assets ?? []).map(asset => <li key={asset.id}><span>{asset.name}</span><b>{money(asset.value)}</b><button className="cl-link" onClick={() => remove(asset)}>Remove</button></li>)}
      {assets?.length === 0 && <li className="cl-muted">No assets added yet.</li>}
      {!assets && <li className="cl-muted">Loading…</li>}
    </ul>
    <p className="cl-total"><span>Total</span><b>{money(total)}</b></p>
    <form className="cl-form" onSubmit={add}>
      <label className="field">Name<input value={name} maxLength={120} placeholder="Furniture, panaflex…" onChange={event => setName(event.target.value)} /></label>
      <label className="field">Value (Rs)<input inputMode="numeric" value={value} onChange={event => setValue(event.target.value)} /></label>
      <button className="button button-black" type="submit">Add</button>
    </form>
    <p className="form-status" role="status">{status}</p>
  </section>;
}
