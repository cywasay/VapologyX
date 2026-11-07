"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { SearchGlyph } from "@/components/art";
import { useStore } from "@/components/store/store-context";
import { phoneMedia } from "@/lib/phone-layout";

// Search, log in, the cart button and the phone menu button.
export function HeaderActions({ menuOpen, onToggleMenu, onOpenDialog }: { menuOpen: boolean; onToggleMenu: () => void; onOpenDialog: () => void }) {
  const { count, openCart, openSearch, toast } = useStore();
  const badge = useRef<HTMLElement>(null);
  useEffect(() => {
    if (toast?.kind !== "added" || !phoneMedia().matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pop = badge.current?.animate([{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 140, easing: "ease-out" });
    return () => pop?.cancel();
  }, [toast]);
  return <div className="header-actions">
    <button className="search-button" onClick={() => { onOpenDialog(); openSearch(); }} aria-label="Search products"><SearchGlyph /></button>
    <Link href="/login" className="login-link">Log in</Link>
    <button className="cart-button" onClick={() => { onOpenDialog(); openCart(); }} aria-label={`Open cart, ${count} items`}>Cart <b ref={badge}>{count}</b></button>
    <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={onToggleMenu}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d={menuOpen ? "m5 5 10 10M15 5 5 15" : "M3 6h14M3 10h14M3 14h14"} /></svg>
    </button>
  </div>;
}
