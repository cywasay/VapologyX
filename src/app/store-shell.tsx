"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ProductArt, Wordmark } from "./art";
import { cart, cartCount, cartKey, cartSubtotal, lineLimit, lineName, lineUnitPrice, useCartLines, type AddResult, type CartLine } from "./cart-store";
import { BRAND, MAX_LINE_QUANTITY, MINIMUM_AGE, money, productHref, type Product, type Variety } from "./products";
import { categories } from "./site-blocks";

type Store = {
  quantityOf: (productId: string) => number;
  add: (product: Product, variety?: Variety | null) => AddResult;
  fit: string;
  setFit: (id: string) => void;
  lines: CartLine[];
  count: number;
  subtotal: number;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};
const StoreContext = createContext<Store | null>(null);

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreShell");
  return store;
}

type Toast = { kind: "added"; key: string } | { kind: "message"; text: string };

export function StoreShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const lines = useCartLines();
  const [fit, setFit] = useState("All");
  const [openMenu, setOpenMenu] = useState<"shop" | "mobile" | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const cartDialog = useRef<HTMLDialogElement>(null);
  const header = useRef<HTMLElement>(null);
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  // On the home page the header shrinks into a floating pill once the hero scrolls away.
  useEffect(() => {
    if (!isHome) return;
    let frame = 0;
    const onScroll = () => {
      frame ||= requestAnimationFrame(() => { frame = 0; setScrolled(window.scrollY > 140); });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [isHome]);

  useEffect(() => {
    if (!openMenu) return;
    const closeOutside = (event: MouseEvent) => { if (!header.current?.contains(event.target as Node)) setOpenMenu(null); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenMenu(null); };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const add = (product: Product, variety: Variety | null = null) => {
    const result = cart.add(product, variety);
    if (result === "added") setToast({ kind: "added", key: cartKey(product.id, variety) });
    else if (result === "sold-out") setToast({ kind: "message", text: `${product.name} is sold out.` });
    else setToast({ kind: "message", text: product.stock !== null && product.stock < MAX_LINE_QUANTITY ? `All ${product.stock} we have of ${product.name} are in your cart.` : `You can order up to ${MAX_LINE_QUANTITY} of ${product.name} at a time.` });
    return result;
  };
  const openCart = () => { setOpenMenu(null); setToast(null); cartDialog.current?.showModal(); };
  const closeCart = () => cartDialog.current?.close();

  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);
  const quantityOf = (productId: string) => lines.filter(line => line.item.id === productId).reduce((sum, line) => sum + line.quantity, 0);
  const addedLine = toast?.kind === "added" ? lines.find(line => line.key === toast.key) : undefined;
  const inShop = categories.some(item => item.href === pathname);
  const navLink = (href: string, label: string) => <Link href={href} className={pathname === href ? "is-current" : ""} aria-current={pathname === href ? "page" : undefined}>{label}</Link>;

  return <StoreContext.Provider value={{ quantityOf, add, fit, setFit, lines, count, subtotal, setQuantity: cart.setQuantity, remove: cart.remove, clear: cart.clear }}>
    <div className="store-frame">
    <div className="notice-bar">Adults {MINIMUM_AGE}+ only. Demo storefront: products and prices are placeholders.</div>
    <header ref={header} className={`site-header motion ${isHome && scrolled ? "is-floating" : ""}`} onClick={event => { if ((event.target as Element).closest("a")) setOpenMenu(null); }}>
      <div className="shell header-inner">
        <Link href="/" aria-label={`${BRAND} home`}><Wordmark /></Link>
        <nav className="site-nav" aria-label="Main navigation">
          <button className={inShop ? "is-current" : ""} aria-expanded={openMenu === "shop"} aria-controls="shop-menu" onClick={() => setOpenMenu(openMenu === "shop" ? null : "shop")}>
            Shop <svg viewBox="0 0 12 12" aria-hidden="true" className={openMenu === "shop" ? "is-flipped" : ""}><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>
          </button>
          {navLink("/about", "About")}
          {navLink("/contact", "Contact")}
          {openMenu === "shop" && <div id="shop-menu" className="shop-menu menu-tiles">
            {categories.map(item => <Link key={item.href} href={item.href}>{item.art}<span>{item.name}</span></Link>)}
          </div>}
        </nav>
        <div className="header-actions">
          <Link href="/login" className="login-link">Log in</Link>
          <button className="cart-button" onClick={openCart} aria-label={`Open cart, ${count} items`}>Cart <b>{count}</b></button>
          <button className="menu-toggle" aria-expanded={openMenu === "mobile"} aria-controls="mobile-menu" aria-label={openMenu === "mobile" ? "Close menu" : "Open menu"} onClick={() => setOpenMenu(openMenu === "mobile" ? null : "mobile")}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d={openMenu === "mobile" ? "m5 5 10 10M15 5 5 15" : "M3 6h14M3 10h14M3 14h14"} /></svg>
          </button>
        </div>
      </div>
      {openMenu === "mobile" && <div id="mobile-menu" className="mobile-menu">
        <div className="menu-tiles">
          {categories.map(item => <Link key={item.href} href={item.href}>{item.art}<span>{item.name}</span></Link>)}
        </div>
        <nav aria-label="More pages">
          {navLink("/about", "About")}
          {navLink("/contact", "Contact")}
          {navLink("/track", "Track order")}
          {navLink("/login", "Log in")}
        </nav>
      </div>}
    </header>

    <main className="store-main">{children}</main>

    <footer className="site-footer motion">
      <div className="shell footer-row">
        <Link href="/" className="footer-brand" aria-label={`${BRAND} home`}><Wordmark /></Link>
        <nav className="footer-links" aria-label="Footer">
          {categories.map(item => <Link key={item.href} href={item.href}>{item.name}</Link>)}
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/track">Track order</Link>
          <Link href="/terms">Terms &amp; conditions</Link>
        </nav>
        <span className="footer-age">{MINIMUM_AGE}+ only</span>
      </div>
      <div className="shell footer-legal">
        <p>© {BRAND}. For adults {MINIMUM_AGE} and over. This is a demo: products, specs and prices are placeholders, and nothing here is for sale.</p>
        <button className="footer-up" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top <i aria-hidden="true">↑</i></button>
      </div>
    </footer>
    </div>

    <div className="cart-toast-region" role="status">
      {addedLine && <div className="cart-toast">
        <div className="cart-thumb"><ProductArt item={addedLine.item} sizes="48px" /></div>
        <div><strong>Added to cart</strong><span>{lineName(addedLine)}</span></div>
        <button className="button button-primary" onClick={openCart}>View cart</button>
      </div>}
      {toast?.kind === "message" && <div className="cart-toast is-message"><strong>{toast.text}</strong></div>}
    </div>

    <dialog ref={cartDialog} className="cart panel-light" aria-labelledby="cart-title" onClick={event => { if (event.target === event.currentTarget) closeCart(); }}>
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
    </dialog>
  </StoreContext.Provider>;
}
