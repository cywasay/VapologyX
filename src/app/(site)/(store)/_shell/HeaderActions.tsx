"use client";

import Link from "next/link";
import { SearchGlyph } from "@/components/art";
import { useStore } from "@/components/store/store-context";

// Search, log in, the cart button and the phone menu button.
export function HeaderActions({ menuOpen, onToggleMenu, onOpenDialog }: { menuOpen: boolean; onToggleMenu: () => void; onOpenDialog: () => void }) {
  const { count, openCart, openSearch } = useStore();
  return <div className="header-actions">
    <button className="search-button" onClick={() => { onOpenDialog(); openSearch(); }} aria-label="Search products"><SearchGlyph /></button>
    <Link href="/login" className="login-link">Log in</Link>
    <button className="cart-button" onClick={() => { onOpenDialog(); openCart(); }} aria-label={`Open cart, ${count} items`}>Cart <b>{count}</b></button>
    <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={onToggleMenu}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d={menuOpen ? "m5 5 10 10M15 5 5 15" : "M3 6h14M3 10h14M3 14h14"} /></svg>
    </button>
  </div>;
}
