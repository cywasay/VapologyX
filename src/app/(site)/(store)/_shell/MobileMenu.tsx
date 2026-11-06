import Link from "next/link";
import { categories } from "@/components/categories";
import { NavLink } from "./NavLink";

// The phone menu, opened from the button in the header.
export function MobileMenu() {
  return <div id="mobile-menu" className="mobile-menu">
    <div className="menu-tiles">
      {categories.map(item => <Link key={item.href} href={item.href}>{item.art}<span>{item.name}</span></Link>)}
    </div>
    <nav aria-label="More pages">
      <NavLink href="/about">About</NavLink>
      <NavLink href="/contact">Contact</NavLink>
      <NavLink href="/track">Track order</NavLink>
      <NavLink href="/login">Log in</NavLink>
    </nav>
  </div>;
}
