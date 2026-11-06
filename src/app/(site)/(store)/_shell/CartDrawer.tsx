"use client";

import Link from "next/link";
import { ProductArt } from "@/components/art";
import { useStore } from "@/components/store/store-context";
import { cart, lineLimit, lineName, lineUnitPrice } from "@/lib/cart-store";
import { money, productHref } from "@/lib/products";

// The cart that slides in from the right.
export function CartDrawer() {
  const { cartDialog, closeCart, lines, subtotal } = useStore();
  return <dialog ref={cartDialog} className="cart panel-light" aria-labelledby="cart-title" onClick={event => { if (event.target === event.currentTarget) closeCart(); }}>
    <div className="cart-inner">
      <div className="cart-top"><h2 id="cart-title">Your cart</h2><button className="cart-close" onClick={closeCart} aria-label="Close cart">×</button></div>
      {lines.length === 0 && <p className="cart-empty">Your cart is empty.</p>}
      <ul>
        {lines.map(line => <li key={line.key}>
          <div className="cart-thumb"><ProductArt item={line.item} sizes="48px" /></div>
          <div className="cart-line"><Link href={productHref(line.item)} onClick={closeCart}><strong>{lineName(line)}</strong></Link><span>{money(lineUnitPrice(line))}</span></div>
          <div className="stepper">
            <button onClick={() => cart.setQuantity(line.key, line.quantity - 1)} aria-label={`Remove one ${lineName(line)}`}>−</button>
            <b>{line.quantity}</b>
            <button onClick={() => cart.setQuantity(line.key, line.quantity + 1)} disabled={line.quantity >= lineLimit(lines, line)} aria-label={`Add one ${lineName(line)}`}>+</button>
          </div>
        </li>)}
      </ul>
      <div className="cart-total"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
      <p className="cart-note">Delivery is worked out at checkout.</p>
      {lines.length > 0
        ? <Link className="button button-primary cart-checkout" href="/checkout" onClick={closeCart}>Checkout</Link>
        : <button className="button button-primary cart-checkout" disabled>Checkout</button>}
      <Link className="text-link cart-full" href="/cart" onClick={closeCart}>View full cart</Link>
    </div>
  </dialog>;
}
