import Link from "next/link";
import { MINIMUM_AGE, money } from "@/lib/products";
import type { Errors, SetValue, Values } from "./checkoutDraft";

export function ConfirmCard({ values, errors, set, pickup, total, busy }: { values: Values; errors: Errors; set: SetValue; pickup: boolean; total: number; busy: boolean }) {
  return <section className="panel-light checkout-card checkout-confirm" aria-label="Place your order">
    <label className="check">
      <input id="checkout-age" type="checkbox" checked={values.age} onChange={event => set("age", event.target.checked)} aria-invalid={errors.age ? true : undefined} aria-describedby={errors.age ? "checkout-age-error" : undefined} />
      <span>I&apos;m {MINIMUM_AGE} or older, and I understand ID may be checked when my order {pickup ? "is collected" : "arrives"}.</span>
    </label>
    {errors.age && <span className="field-error" id="checkout-age-error">{errors.age}</span>}
    <p className="checkout-terms">By placing your order you agree to our <Link href="/terms">terms &amp; conditions</Link>.</p>
    <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Placing your order…" : `Place order · ${money(total)}`}</button>
  </section>;
}
