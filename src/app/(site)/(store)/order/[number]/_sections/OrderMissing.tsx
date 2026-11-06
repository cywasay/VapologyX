import Link from "next/link";

export function OrderMissing({ number }: { number: string }) {
  return <section className="shell flow" aria-labelledby="order-title">
    <div className="flow-head"><h1 id="order-title">We can&apos;t find that order.</h1></div>
    <div className="flow-empty panel-light">
      <p>Order {number.toUpperCase()} isn&apos;t saved in this browser. If you ordered on another phone or computer, use your order number and mobile number to look it up.</p>
      <Link className="button button-primary" href={`/track?number=${encodeURIComponent(number)}`}>Track an order</Link>
    </div>
  </section>;
}
