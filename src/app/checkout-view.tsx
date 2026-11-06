"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { lineUnitPrice, useCartSync, useHydrated, type CartLine } from "./cart-store";
import { DemoNote, FlowSteps, FreeDeliveryBar, SummaryLine } from "./flow-ui";
import { CITIES, DELIVERY_FEE, DELIVERY_METHODS, FREE_DELIVERY_FROM, PAYMENT_METHODS, normalizePhone, orderTotals, paymentNote, placeOrder, type DeliveryMethod, type OrderLine, type PaymentId } from "./orders";
import { MINIMUM_AGE, money } from "./products";
import { StoreDetails } from "./site-blocks";
import { useStore } from "./store-shell";

const DRAFT_KEY = "vx-checkout-v1";

type Values = { name: string; phone: string; email: string; method: DeliveryMethod; address: string; city: string; notes: string; payment: PaymentId; age: boolean };
type Field = "name" | "phone" | "email" | "address" | "city" | "age";
type Errors = Partial<Record<Field, string>>;

const FIELD_ORDER: Field[] = ["name", "phone", "email", "address", "city", "age"];
const BLANK: Values = { name: "", phone: "", email: "", method: "delivery", address: "", city: "", notes: "", payment: "cod", age: false };

// Contact and address details are remembered for next time. The notes and the age tick box never are.
function readDraft(): Values {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as Partial<Values> | null;
    if (!saved) return BLANK;
    const text = (value: unknown) => typeof value === "string" ? value.slice(0, 300) : "";
    return {
      ...BLANK,
      name: text(saved.name),
      phone: text(saved.phone),
      email: text(saved.email),
      address: text(saved.address),
      city: text(saved.city),
      method: DELIVERY_METHODS.find(method => method.id === saved.method)?.id ?? "delivery",
      payment: PAYMENT_METHODS.find(method => method.id === saved.payment)?.id ?? "cod",
    };
  } catch {
    return BLANK;
  }
}

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!normalizePhone(values.phone)) errors.phone = "Enter a mobile number like 0300 1234567.";
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "That email doesn't look right.";
  if (values.method === "delivery") {
    if (values.address.trim().length < 8) errors.address = "Enter your full address, with the house or street.";
    if (values.city.trim().length < 2) errors.city = "Enter your city.";
  }
  if (!values.age) errors.age = `Please confirm you're ${MINIMUM_AGE} or older.`;
  return errors;
}

const without = (errors: Errors, ...fields: Field[]): Errors => Object.fromEntries(Object.entries(errors).filter(([field]) => !fields.includes(field as Field)));

const toOrderLine = (line: CartLine): OrderLine => ({
  productId: line.item.id,
  slug: line.item.slug,
  name: line.item.name,
  variety: line.variety?.name ?? null,
  unitPrice: lineUnitPrice(line),
  quantity: line.quantity,
  category: line.item.category,
  type: line.item.type,
  color: line.item.color,
  image_url: line.item.image_url,
});

type TextFieldProps = { id: Field | "notes"; label: string; error?: string; hint?: string; optional?: boolean; onValue: (value: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "onChange">;

function TextField({ id, label, error, hint, optional, onValue, ...input }: TextFieldProps) {
  const describedBy = error ? `checkout-${id}-error` : hint ? `checkout-${id}-hint` : undefined;
  return <div className="field">
    <label htmlFor={`checkout-${id}`}>{label}{optional && <span> (optional)</span>}</label>
    <input {...input} id={`checkout-${id}`} name={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} onChange={event => onValue(event.target.value)} />
    {error ? <span className="field-error" id={`checkout-${id}-error`}>{error}</span> : hint && <span className="field-hint" id={`checkout-${id}-hint`}>{hint}</span>}
  </div>;
}

function Choice({ name, value, selected, onSelect, title, note, aside }: { name: string; value: string; selected: boolean; onSelect: () => void; title: string; note?: string; aside?: string }) {
  return <label className={`choice ${selected ? "is-selected" : ""}`}>
    <input type="radio" name={name} value={value} checked={selected} onChange={onSelect} />
    <span className="choice-dot" aria-hidden="true" />
    <span className="choice-text"><strong>{title}</strong>{note && <small>{note}</small>}</span>
    {aside && <b className="choice-aside">{aside}</b>}
  </label>;
}

function CheckoutForm({ lines, locked, onPlaced }: { lines: CartLine[]; locked: boolean; onPlaced: (lines: CartLine[]) => void }) {
  const router = useRouter();
  const { clear } = useStore();
  const [values, setValues] = useState<Values>(readDraft);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  // Set the moment the button is pressed, so a double click can't place the order twice before the page redraws.
  const sending = useRef(false);
  const subtotal = lines.reduce((sum, line) => sum + lineUnitPrice(line) * line.quantity, 0);
  const totals = orderTotals(subtotal, values.method);
  const deliveryFree = subtotal >= FREE_DELIVERY_FROM;
  const pickup = values.method === "pickup";

  useEffect(() => {
    const { name, phone, email, address, city, method, payment } = values;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, phone, email, address, city, method, payment }));
    } catch {}
  }, [values]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues(current => ({ ...current, [key]: value }));
    setErrors(current => without(current, key as Field));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || busy || locked) return;
    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setFormError("Please check the highlighted fields.");
      const first = FIELD_ORDER.find(field => found[field]);
      if (first) document.getElementById(`checkout-${first}`)?.focus();
      return;
    }
    sending.current = true;
    setBusy(true);
    setFormError("");
    try {
      const order = await placeOrder({
        customer: { name: values.name.trim(), phone: normalizePhone(values.phone) ?? values.phone.trim(), email: values.email.trim() },
        delivery: { method: values.method, address: pickup ? "" : values.address.trim(), city: pickup ? "" : values.city.trim(), notes: values.notes.trim() },
        payment: values.payment,
        lines: lines.map(toOrderLine),
      });
      onPlaced(lines);
      clear();
      router.push(`/order/${order.number}`);
    } catch {
      setFormError("We couldn't place your order. Please try again.");
      sending.current = false;
      setBusy(false);
    }
  }

  return <form className="checkout" onSubmit={submit} noValidate>
    {formError && <p className="flow-error" role="alert">{formError}</p>}

    <section className="panel-light checkout-card" aria-labelledby="checkout-contact">
      <h2 id="checkout-contact">Your details</h2>
      <div className="checkout-pair">
        <TextField id="name" label="Full name" value={values.name} error={errors.name} autoComplete="name" onValue={value => set("name", value)} />
        <TextField id="phone" label="Mobile number" value={values.phone} error={errors.phone} hint="We message you on this number to confirm your order." type="tel" inputMode="tel" autoComplete="tel" onValue={value => set("phone", value)} />
      </div>
      <TextField id="email" label="Email" optional value={values.email} error={errors.email} type="email" autoComplete="email" onValue={value => set("email", value)} />
    </section>

    <section className="panel-light checkout-card" aria-labelledby="checkout-delivery">
      <h2 id="checkout-delivery">Delivery</h2>
      <fieldset className="choice-group">
        <legend className="sr-only">How would you like to get your order?</legend>
        <Choice name="method" value="delivery" selected={!pickup} onSelect={() => { set("method", "delivery"); }} title="Home delivery" note="We bring it to your door." aside={deliveryFree ? "Free" : money(DELIVERY_FEE)} />
        <Choice name="method" value="pickup" selected={pickup} onSelect={() => { set("method", "pickup"); setErrors(current => without(current, "address", "city")); }} title="Store pickup" note="Collect it from the store when it's ready." aside="Free" />
      </fieldset>
      {pickup
        ? <div className="checkout-pickup"><strong>Collect your order here</strong><StoreDetails /></div>
        : <>
          <TextField id="address" label="Address" value={values.address} error={errors.address} hint="House or flat number, street and area." autoComplete="street-address" onValue={value => set("address", value)} />
          <TextField id="city" label="City" value={values.city} error={errors.city} list="checkout-cities" autoComplete="address-level2" onValue={value => set("city", value)} />
          <datalist id="checkout-cities">{CITIES.map(city => <option key={city} value={city} />)}</datalist>
        </>}
      <div className="field">
        <label htmlFor="checkout-notes">{pickup ? "Note for the store" : "Delivery note"}<span> (optional)</span></label>
        <textarea id="checkout-notes" name="notes" rows={3} maxLength={300} value={values.notes} onChange={event => set("notes", event.target.value)} />
      </div>
    </section>

    <section className="panel-light checkout-card" aria-labelledby="checkout-payment">
      <h2 id="checkout-payment">Payment</h2>
      <fieldset className="choice-group">
        <legend className="sr-only">How would you like to pay?</legend>
        {PAYMENT_METHODS.map(method => <Choice key={method.id} name="payment" value={method.id} selected={values.payment === method.id} onSelect={() => set("payment", method.id)} title={method.label} note={paymentNote(method.id, values.method)} />)}
      </fieldset>
    </section>

    <aside className="summary checkout-summary" aria-label="Order summary">
      <h2>Order summary</h2>
      <ul className="summary-lines">
        {lines.map(line => <SummaryLine key={line.key} art={line.item} name={line.item.name} variety={line.variety?.name ?? null} quantity={line.quantity} total={lineUnitPrice(line) * line.quantity} />)}
      </ul>
      <dl>
        <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
        <div><dt>{pickup ? "Pickup" : "Delivery"}</dt><dd>{totals.deliveryFee === 0 ? "Free" : money(totals.deliveryFee)}</dd></div>
        <div className="summary-total"><dt>Total</dt><dd>{money(totals.total)}</dd></div>
      </dl>
      {!pickup && !deliveryFree && <FreeDeliveryBar subtotal={subtotal} />}
      <Link className="summary-link" href="/cart">Edit cart</Link>
    </aside>

    <section className="panel-light checkout-card checkout-confirm" aria-label="Place your order">
      <label className="check">
        <input id="checkout-age" type="checkbox" checked={values.age} onChange={event => set("age", event.target.checked)} aria-invalid={errors.age ? true : undefined} aria-describedby={errors.age ? "checkout-age-error" : undefined} />
        <span>I&apos;m {MINIMUM_AGE} or older, and I understand ID may be checked when my order {pickup ? "is collected" : "arrives"}.</span>
      </label>
      {errors.age && <span className="field-error" id="checkout-age-error">{errors.age}</span>}
      <p className="checkout-terms">By placing your order you agree to our <Link href="/terms">terms &amp; conditions</Link>.</p>
      <button className="button button-primary" type="submit" disabled={busy || locked}>{busy || locked ? "Placing your order…" : `Place order · ${money(totals.total)}`}</button>
      <DemoNote>Demo checkout. Your order is saved in this browser only, and nothing is sent to the shop yet.</DemoNote>
    </section>
  </form>;
}

export function CheckoutView() {
  const hydrated = useHydrated();
  const { lines } = useStore();
  const sync = useCartSync();
  // Placing an order empties the cart, so the page keeps showing what was ordered until the confirmation opens.
  const [placed, setPlaced] = useState<CartLine[] | null>(null);
  const shown = placed ?? lines;
  // Next.js keeps this page alive, hidden, when the customer moves on. Once an order has gone through, forget it as
  // the page is hidden, so the next visit starts a fresh checkout. A half-filled form is left alone.
  const placedAnOrder = useRef(false);
  useLayoutEffect(() => () => {
    if (!placedAnOrder.current) return;
    placedAnOrder.current = false;
    setPlaced(null);
  }, []);

  return <section className="shell flow" aria-labelledby="checkout-title">
    <div className="flow-head">
      <FlowSteps current={2} />
      <h1 id="checkout-title">Checkout</h1>
    </div>

    {sync.notices.length > 0 && <div className="flow-notice" role="status">
      <ul>{sync.notices.map(notice => <li key={notice}>{notice}</li>)}</ul>
      <button onClick={sync.dismiss}>Dismiss</button>
    </div>}
    {sync.state === "failed" && <div className="flow-notice" role="status"><ul><li>We couldn&apos;t check the latest prices just now, so the totals below may be out of date.</li></ul></div>}

    {!hydrated && <div className="skeleton skeleton-panel" aria-hidden="true" />}

    {hydrated && shown.length === 0 && <div className="flow-empty panel-light">
      <h2>There&apos;s nothing to check out.</h2>
      <p>Your cart is empty. Add something from a shelf first.</p>
      <Link className="button button-primary" href="/devices">Shop devices</Link>
    </div>}

    {hydrated && shown.length > 0 && <CheckoutForm lines={shown} locked={placed !== null} onPlaced={ordered => { placedAnOrder.current = true; setPlaced(ordered); }} />}
  </section>;
}
