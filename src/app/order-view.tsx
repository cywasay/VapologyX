"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { DemoNote, FlowSkeleton, FlowSteps, SummaryLine } from "./flow-ui";
import { ORDER_STEPS, findOrder, normalizePhone, paymentLabel, statusLabel, statusNote, type Order } from "./orders";
import { money } from "./products";

function OrderNumber({ number }: { number: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
    } catch {}
  }

  return <div className="order-number">
    <span>{number}</span>
    <button type="button" onClick={copy} aria-label={`Copy order number ${number}`}>{copied ? "Copied" : "Copy"}</button>
  </div>;
}

function OrderSummary({ order }: { order: Order }) {
  return <aside className="summary" aria-label="Order summary">
    <h2>Order summary</h2>
    <ul className="summary-lines">
      {order.lines.map((line, index) => <SummaryLine key={`${line.productId}-${line.variety ?? ""}-${index}`} art={line} name={line.name} variety={line.variety} quantity={line.quantity} total={line.unitPrice * line.quantity} />)}
    </ul>
    <dl>
      <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
      <div><dt>{order.delivery.method === "pickup" ? "Pickup" : "Delivery"}</dt><dd>{order.deliveryFee === 0 ? "Free" : money(order.deliveryFee)}</dd></div>
      <div className="summary-total"><dt>Total</dt><dd>{money(order.total)}</dd></div>
    </dl>
  </aside>;
}

function OrderDetails({ order }: { order: Order }) {
  const { customer, delivery } = order;
  return <dl className="detail-list">
    <div><dt>Name</dt><dd>{customer.name}</dd></div>
    <div><dt>Mobile</dt><dd>{customer.phone}</dd></div>
    {customer.email && <div><dt>Email</dt><dd>{customer.email}</dd></div>}
    {delivery.method === "delivery"
      ? <div><dt>Deliver to</dt><dd>{delivery.address}, {delivery.city}</dd></div>
      : <div><dt>Collect from</dt><dd>The store</dd></div>}
    <div><dt>Payment</dt><dd>{paymentLabel(order.payment)}</dd></div>
    {delivery.notes && <div><dt>Note</dt><dd>{delivery.notes}</dd></div>}
    <div><dt>Placed</dt><dd>{new Date(order.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</dd></div>
  </dl>;
}

// How far along the order is. A cancelled order skips the steps and says so plainly.
function StatusTimeline({ order }: { order: Order }) {
  const method = order.delivery.method;
  if (order.status === "cancelled") {
    return <div className="timeline-cancelled" role="status"><strong>{statusLabel("cancelled", method)}</strong><p>{statusNote("cancelled", method)}</p></div>;
  }
  const current = ORDER_STEPS.indexOf(order.status);
  const finished = order.status === "delivered";
  return <div className="panel-light checkout-card">
    <p className="timeline-note" role="status">{statusNote(order.status, method)}</p>
    <ol className="timeline" aria-label="Order progress">
      {ORDER_STEPS.map((step, index) => {
        const done = index < current || (finished && index === current);
        return <li key={step} className={done ? "is-done" : index === current ? "is-current" : ""} aria-current={index === current ? "step" : undefined}>
          <span className="timeline-dot" aria-hidden="true">{done ? "✓" : index + 1}</span>
          <span>{statusLabel(step, method)}</span>
        </li>;
      })}
    </ol>
  </div>;
}

function nextSteps(order: Order) {
  const { method, city } = order.delivery;
  const steps = [`We message you on ${order.customer.phone} to confirm your order.`];
  if (order.payment === "transfer") steps.push("We send you the account details, and pack your order as soon as the payment arrives.");
  else steps.push(method === "pickup" ? "We pack your order and message you when it's ready to collect." : `We pack your order and send it to ${city}.`);
  if (order.payment === "cod") steps.push(method === "pickup" ? "You pay in cash when you collect it." : "You pay the rider in cash when it arrives.");
  steps.push("Keep your order number. You can use it to track your order at any time.");
  return steps;
}

type OrderResult = { state: "loading" } | { state: "missing" } | { state: "found"; order: Order };

// The confirmation page, opened straight after checkout.
export function OrderView({ number }: { number: string }) {
  const [result, setResult] = useState<OrderResult>({ state: "loading" });

  useEffect(() => {
    let stale = false;
    findOrder(number).then(order => { if (!stale) setResult(order ? { state: "found", order } : { state: "missing" }); });
    return () => { stale = true; };
  }, [number]);

  if (result.state === "loading") return <FlowSkeleton />;

  if (result.state === "missing") {
    return <section className="shell flow" aria-labelledby="order-title">
      <div className="flow-head"><h1 id="order-title">We can&apos;t find that order.</h1></div>
      <div className="flow-empty panel-light">
        <p>Order {number.toUpperCase()} isn&apos;t saved in this browser. If you ordered on another phone or computer, use your order number and mobile number to look it up.</p>
        <Link className="button button-primary" href={`/track?number=${encodeURIComponent(number)}`}>Track an order</Link>
      </div>
    </section>;
  }

  const { order } = result;
  return <section className="shell flow" aria-labelledby="order-title">
    <div className="flow-head">
      <FlowSteps current={3} />
      <h1 id="order-title">Thank you, {order.customer.name.split(" ")[0]}.</h1>
      <p>Your order is in. This is your order number:</p>
      <OrderNumber number={order.number} />
    </div>
    <div className="order-layout">
      <div className="order-main">
        <div className="panel-light checkout-card">
          <h2>What happens next</h2>
          <ol className="next-steps">{nextSteps(order).map(step => <li key={step}>{step}</li>)}</ol>
        </div>
        <div className="panel-light checkout-card">
          <h2>Your details</h2>
          <OrderDetails order={order} />
        </div>
        <div className="order-actions">
          <Link className="button button-primary" href={`/track?number=${encodeURIComponent(order.number)}`}>Track this order</Link>
          <Link className="button button-outline" href="/devices">Keep shopping</Link>
        </div>
        <DemoNote>This is a demo order. It is saved in this browser only, and nothing has been sent to the shop.</DemoNote>
      </div>
      <OrderSummary order={order} />
    </div>
  </section>;
}

type TrackResult = { state: "idle" } | { state: "looking" } | { state: "missing" } | { state: "found"; order: Order };

// "Track my order": the order number and the mobile number it was placed with.
export function TrackView() {
  const params = useSearchParams();
  const fromLink = (params.get("number") ?? "").toUpperCase();
  const [number, setNumber] = useState(fromLink);
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ number?: string; phone?: string }>({});
  const [result, setResult] = useState<TrackResult>({ state: "idle" });
  // Next.js keeps this page alive when the customer leaves it, so a new "Track this order" link has to replace
  // the order number and the old result. The reset happens during the render, which is how React asks for it.
  const [linkedNumber, setLinkedNumber] = useState(fromLink);
  if (fromLink !== linkedNumber) {
    setLinkedNumber(fromLink);
    setNumber(fromLink);
    setErrors({});
    setResult({ state: "idle" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (result.state === "looking") return;
    const found: typeof errors = {};
    if (number.trim().length < 4) found.number = "Enter your order number, like VX-AB12CD.";
    if (!normalizePhone(phone)) found.phone = "Enter the mobile number you ordered with.";
    setErrors(found);
    if (found.number || found.phone) {
      document.getElementById(found.number ? "track-number" : "track-phone")?.focus();
      return;
    }
    setResult({ state: "looking" });
    const order = await findOrder(number, phone);
    setResult(order ? { state: "found", order } : { state: "missing" });
  }

  return <section className="shell flow" aria-labelledby="track-title">
    <div className="flow-head">
      <h1 id="track-title">Track your order</h1>
      <p>Enter your order number and the mobile number you ordered with.</p>
    </div>

    <form className="panel-light checkout-card track-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="track-number">Order number</label>
        <input id="track-number" name="number" value={number} autoCapitalize="characters" autoComplete="off" aria-invalid={errors.number ? true : undefined} aria-describedby={errors.number ? "track-number-error" : undefined} onChange={event => { setNumber(event.target.value.toUpperCase()); setErrors(current => ({ ...current, number: undefined })); }} />
        {errors.number && <span className="field-error" id="track-number-error">{errors.number}</span>}
      </div>
      <div className="field">
        <label htmlFor="track-phone">Mobile number</label>
        <input id="track-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} aria-invalid={errors.phone ? true : undefined} aria-describedby={errors.phone ? "track-phone-error" : undefined} onChange={event => { setPhone(event.target.value); setErrors(current => ({ ...current, phone: undefined })); }} />
        {errors.phone && <span className="field-error" id="track-phone-error">{errors.phone}</span>}
      </div>
      <button className="button button-primary" type="submit" disabled={result.state === "looking"}>{result.state === "looking" ? "Looking…" : "Track order"}</button>
    </form>

    {result.state === "missing" && <p className="flow-error track-missing" role="alert">We couldn&apos;t find an order with that number and mobile number. Check them and try again.</p>}

    {result.state === "found" && <div className="order-layout track-result">
      <div className="order-main">
        <div className="track-head"><span>Order</span><OrderNumber number={result.order.number} /></div>
        <StatusTimeline order={result.order} />
        <div className="panel-light checkout-card">
          <h2>Your details</h2>
          <OrderDetails order={result.order} />
        </div>
      </div>
      <OrderSummary order={result.order} />
    </div>}

    <DemoNote>Demo tracking. Only orders placed in this browser can be found for now.</DemoNote>
  </section>;
}
