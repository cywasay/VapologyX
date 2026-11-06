"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/art";
import { BRAND } from "@/lib/products";
import { HeaderActions } from "./HeaderActions";
import { HeaderNav } from "./HeaderNav";
import { MobileMenu } from "./MobileMenu";
import { useFloatingHeader } from "./useFloatingHeader";

// The bar at the top of every shop page. It owns the open/closed state of the Shop and phone menus.
export function Header() {
  const [openMenu, setOpenMenu] = useState<"shop" | "mobile" | null>(null);
  const header = useRef<HTMLElement>(null);
  const floating = useFloatingHeader(usePathname() === "/");

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

  const toggle = (menu: "shop" | "mobile") => setOpenMenu(openMenu === menu ? null : menu);

  return <header ref={header} className={`site-header motion ${floating ? "is-floating" : ""}`} onClick={event => { if ((event.target as Element).closest("a")) setOpenMenu(null); }}>
    <div className="shell header-inner">
      <Link href="/" aria-label={`${BRAND} home`}><Wordmark /></Link>
      <HeaderNav open={openMenu === "shop"} onToggle={() => toggle("shop")} />
      <HeaderActions menuOpen={openMenu === "mobile"} onToggleMenu={() => toggle("mobile")} onOpenDialog={() => setOpenMenu(null)} />
    </div>
    {openMenu === "mobile" && <MobileMenu />}
  </header>;
}
