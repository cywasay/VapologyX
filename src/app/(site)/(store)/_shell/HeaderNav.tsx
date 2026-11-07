"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { categories } from "@/components/categories";
import { NavLink } from "./NavLink";

// The main links: a Shop drop-down with the four shelves, then About and Contact.
// The drop-down stays in the page, hidden, so it can animate closed as well as open.
export function HeaderNav({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const inShop = categories.some(item => item.href === pathname);
  return <nav className="site-nav" aria-label="Main navigation">
    <button className={inShop ? "is-current" : ""} aria-expanded={open} aria-controls="shop-menu" onClick={onToggle}>
      Shop <svg viewBox="0 0 12 12" aria-hidden="true" className={open ? "is-flipped" : ""}><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>
    </button>
    <NavLink href="/about">About</NavLink>
    <NavLink href="/contact">Contact</NavLink>
    <div id="shop-menu" className={`shop-menu ${open ? "is-open" : ""}`} inert={!open}>
      <div className="shop-menu-panel">
        <ul className="shop-menu-grid">
          {categories.map((item, index) => <li key={item.href} style={{ "--i": index } as CSSProperties}>
            <Link href={item.href} className={`shop-tile ${item.tone}`} aria-current={pathname === item.href ? "page" : undefined}>
              <span className="shop-tile-art">{item.art}</span>
              <span className="shop-tile-copy"><strong>{item.name}</strong><small>{item.blurb}</small></span>
              <i aria-hidden="true">→</i>
            </Link>
          </li>)}
        </ul>
        <div className="shop-menu-foot" style={{ "--i": categories.length } as CSSProperties}>
          <span>Not sure which coil fits your device?</span>
          <Link href="/#coil-finder">Find my coil <i aria-hidden="true">↗</i></Link>
        </div>
      </div>
    </div>
  </nav>;
}
