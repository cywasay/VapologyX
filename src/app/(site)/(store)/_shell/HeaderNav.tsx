"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "@/components/categories";
import { NavLink } from "./NavLink";

// The main links: a Shop drop-down with the four shelves, then About and Contact.
export function HeaderNav({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const inShop = categories.some(item => item.href === pathname);
  return <nav className="site-nav" aria-label="Main navigation">
    <button className={inShop ? "is-current" : ""} aria-expanded={open} aria-controls="shop-menu" onClick={onToggle}>
      Shop <svg viewBox="0 0 12 12" aria-hidden="true" className={open ? "is-flipped" : ""}><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>
    </button>
    <NavLink href="/about">About</NavLink>
    <NavLink href="/contact">Contact</NavLink>
    {open && <div id="shop-menu" className="shop-menu menu-tiles">
      {categories.map(item => <Link key={item.href} href={item.href}>{item.art}<span>{item.name}</span></Link>)}
    </div>}
  </nav>;
}
