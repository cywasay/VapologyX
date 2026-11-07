import Link from "next/link";
import { Wordmark } from "@/components/art";
import { categories } from "@/components/categories";
import { BRAND, MINIMUM_AGE } from "@/lib/products";
import { BackToTop } from "./BackToTop";

export function Footer() {
  return <footer className="site-footer motion">
    <div className="shell footer-row">
      <Link href="/" className="footer-brand" aria-label={`${BRAND} home`}><Wordmark /></Link>
      <nav className="footer-links" aria-label="Footer">
        {categories.map(item => <Link key={item.href} href={item.href}>{item.name}</Link>)}
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/track">Track order</Link>
        <Link href="/shipping">Shipping</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms &amp; conditions</Link>
      </nav>
      <span className="footer-age">{MINIMUM_AGE}+ only</span>
    </div>
    <div className="shell footer-legal">
      <p>© {BRAND}. For adults {MINIMUM_AGE} and over. This is a demo: products, specs and prices are placeholders, and nothing here is for sale.</p>
      <BackToTop />
    </div>
  </footer>;
}
