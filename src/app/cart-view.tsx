"use client";

import Link from "next/link";
import { ProductArt } from "./art";
import { lineLimit, lineName, lineUnitPrice, useCartSync, useHydrated } from "./cart-store";
import { FlowSteps, FreeDeliveryBar } from "./flow-ui";
import { DELIVERY_FEE, FREE_DELIVERY_FROM } from "./orders";
import { fewLeft, money, productHref } from "./products";
import { categories } from "./site-blocks";
import { useStore } from "./store-shell";

export function CartView() {
  const hydrated = useHydrated();
  const { lines, count, subtotal, setQuantity, remove } = useStore();
  const sync = useCartSync();

  return <section className="shell flow" aria-labelledby="cart-page-title">
    <div className="flow-head">
      <FlowSteps current={1} />
      <h1 id="cart-page-title">Your cart</h1>
      {hydrated && count > 0 && <p>{count} {count === 1 ? "item" : "items"} ready to order.</p>}
    </div>

    {sync.notices.length > 0 && <div className="flow-notice" role="status">
      <ul>{sync.notices.map(notice => <li key={notice}>{notice}</li>)}</ul>
      <button onClick={sync.dismiss}>Dismiss</button>
    </div>}

    {!hydrated && <div className="skeleton skeleton-panel" aria-hidden="true" />}

    {hydrated && lines.length === 0 && <div className="flow-empty panel-light">
      <h2>Your cart is empty.</h2>
      <p>Pick something from a shelf and it will wait for you here.</p>
      <div className="menu-tiles flow-shelves">
        {categories.map(item => <Link key={item.href} href={item.href}>{item.art}<span>{item.name}</span></Link>)}
      </div>
    </div>}

    {hydrated && lines.length > 0 && <div className="cart-layout">
      <ul className="cart-list panel-light">
        {lines.map(line => {
          const unit = lineUnitPrice(line);
          const few = fewLeft(line.item);
          return <li key={line.key} className="cart-row">
            <Link href={productHref(line.item)} className="cart-row-image" aria-label={`View ${line.item.name}`} tabIndex={-1}><ProductArt item={line.item} sizes="88px" /></Link>
            <div className="cart-row-main">
              <Link href={productHref(line.item)} className="cart-row-name">{line.item.name}</Link>
              {line.variety && <span>{line.variety.name}</span>}
              <span>{money(unit)} each</span>
              {few && <em className="stock-note">Only {few} left</em>}
            </div>
            <div className="stepper">
              <button onClick={() => setQuantity(line.key, line.quantity - 1)} aria-label={`Remove one ${lineName(line)}`}>−</button>
              <b aria-label={`${line.quantity} in your cart`}>{line.quantity}</b>
              <button onClick={() => setQuantity(line.key, line.quantity + 1)} disabled={line.quantity >= lineLimit(lines, line)} aria-label={`Add one ${lineName(line)}`} title={line.quantity >= lineLimit(lines, line) ? "That's the most you can order" : undefined}>+</button>
            </div>
            <strong className="cart-row-total">{money(unit * line.quantity)}</strong>
            <button className="cart-row-remove" onClick={() => remove(line.key)} aria-label={`Remove ${lineName(line)} from your cart`}>Remove</button>
          </li>;
        })}
      </ul>

      <aside className="summary" aria-label="Order summary">
        <h2>Summary</h2>
        <dl>
          <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
          <div><dt>Delivery</dt><dd>Worked out at checkout</dd></div>
        </dl>
        <FreeDeliveryBar subtotal={subtotal} />
        <Link className="button button-lime" href="/checkout">Go to checkout</Link>
        <Link className="summary-link" href="/devices">Keep shopping</Link>
        <p className="summary-note">Delivery is {money(DELIVERY_FEE)}, and free over {money(FREE_DELIVERY_FROM)}. Picking up from the store is always free.</p>
      </aside>
    </div>}
  </section>;
}
