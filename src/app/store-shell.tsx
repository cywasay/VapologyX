"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ProductArt, Wordmark } from "./art";
import { BRAND, MINIMUM_AGE, money, productHref, varietyPrice, type Product, type Variety } from "./products";
import { categories } from "./site-blocks";

type CartLine = { key: string; product: Product; variety: Variety | null; quantity: number };
type Store = {
  quantityOf: (productId: string) => number;
  add: (product: Product, variety?: Variety | null) => void;
  fit: string;
  setFit: (id: string) => void;
};
const StoreContext = createContext<Store | null>(null);

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreShell");
  return store;
}

const lineName = (line: CartLine) => line.variety ? `${line.product.name} (${line.variety.name})` : line.product.name;

export function StoreShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [fit, setFit] = useState("All");
  const [openMenu, setOpenMenu] = useState<"shop" | "mobile" | null>(null);
  const [added, setAdded] = useState<{ key: string } | null>(null);
  const cartDialog = useRef<HTMLDialogElement>(null);
  const header = useRef<HTMLElement>(null);

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
    if (!added) return;
    const timer = setTimeout(() => setAdded(null), 4000);
    return () => clearTimeout(timer);
  }, [added]);

  const changeQuantity = (key: string, change: number) => setCart(current => {
    const line = current[key];
    if (!line) return current;
    if (line.quantity + change > 0) return { ...current, [key]: { ...line, quantity: line.quantity + change } };
    return Object.fromEntries(Object.entries(current).filter(([other]) => other !== key));
  });
  const add = (product: Product, variety: Variety | null = null) => {
    const key = variety ? `${product.id}:${variety.name}` : product.id;
    setCart(current => ({ ...current, [key]: { key, product, variety, quantity: (current[key]?.quantity ?? 0) + 1 } }));
    setAdded({ key });
  };
  const openCart = () => { setOpenMenu(null); setAdded(null); cartDialog.current?.showModal(); };

  const lines = Object.values(cart);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + varietyPrice(line.product, line.variety) * line.quantity, 0);
  const quantityOf = (productId: string) => lines.filter(line => line.product.id === productId).reduce((sum, line) => sum + line.quantity, 0);
  const addedLine = added && cart[added.key];
  const inShop = categories.some(item => item.href === pathname);
  const navLink = (href: string, label: string) => <Link href={href} className={pathname === href ? "is-current" : ""} aria-current={pathname === href ? "page" : undefined}>{label}</Link>;

  return <StoreContext.Provider value={{ quantityOf, add, fit, setFit }}>
    <div className="notice-bar">Adults {MINIMUM_AGE}+ only. Demo storefront: products and prices are placeholders.</div>
    <header ref={header} className="site-header" onClick={event => { if ((event.target as Element).closest("a")) setOpenMenu(null); }}>
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
          {navLink("/login", "Log in")}
        </nav>
      </div>}
    </header>

    <main>{children}</main>

    <footer className="site-footer"><div className="shell footer-inner">
      <Wordmark />
      <nav className="footer-links" aria-label="Footer">
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/terms">Terms &amp; conditions</Link>
      </nav>
      <p>For adults {MINIMUM_AGE} and over. This is a demo: products, specs and prices are placeholders, and nothing here is for sale.</p>
    </div></footer>

    <div className="cart-toast-region" role="status">
      {addedLine && <div className="cart-toast">
        <div className="cart-thumb"><ProductArt item={addedLine.product} sizes="48px" /></div>
        <div><strong>Added to cart</strong><span>{lineName(addedLine)}</span></div>
        <button className="button button-primary" onClick={openCart}>View cart</button>
      </div>}
    </div>

    <dialog ref={cartDialog} className="cart panel-light" aria-labelledby="cart-title" onClick={event => { if (event.target === event.currentTarget) cartDialog.current?.close(); }}>
      <div className="cart-inner">
        <div className="cart-top"><h2 id="cart-title">Your cart</h2><button className="cart-close" onClick={() => cartDialog.current?.close()} aria-label="Close cart">×</button></div>
        {lines.length === 0 && <p className="cart-empty">Your cart is empty.</p>}
        <ul>
          {lines.map(line => <li key={line.key}>
            <div className="cart-thumb"><ProductArt item={line.product} sizes="48px" /></div>
            <div className="cart-line"><Link href={productHref(line.product)} onClick={() => cartDialog.current?.close()}><strong>{lineName(line)}</strong></Link><span>{money(varietyPrice(line.product, line.variety))}</span></div>
            <div className="stepper">
              <button onClick={() => changeQuantity(line.key, -1)} aria-label={`Remove one ${lineName(line)}`}>−</button>
              <b>{line.quantity}</b>
              <button onClick={() => changeQuantity(line.key, 1)} aria-label={`Add one ${lineName(line)}`}>+</button>
            </div>
          </li>)}
        </ul>
        <div className="cart-total"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
        <button className="button button-primary cart-checkout" disabled>Checkout disabled in demo</button>
      </div>
    </dialog>
  </StoreContext.Provider>;
}
