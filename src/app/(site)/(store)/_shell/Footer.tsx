import Link from "next/link";
import type { CSSProperties } from "react";
import { categories } from "@/components/categories";
import { BRAND, MINIMUM_AGE } from "@/lib/products";
import { STORE } from "@/lib/store-info";
import { BackToTop } from "./BackToTop";

const BAND = ["Genuine products only", "Devices", "Disposables", "Bottles", "Coils", "Islamabad", "Delivery across Pakistan"];
const HELP = [["Track order", "/track"], ["Shipping & delivery", "/shipping"], ["Questions & answers", "/faq"], ["About us", "/about"], ["Contact", "/contact"]];
const LEGAL = [["Privacy", "/privacy"], ["Terms & conditions", "/terms"]];

// The footer: a moving band of what the shop is about, the links in columns, the visit details,
// and a giant wordmark whose letters rise one by one as the footer comes into view (see .site-footer in globals.css).
export function Footer() {
  return <footer className="site-footer motion">
    <div className="footer-band" aria-hidden="true">
      <div className="footer-band-track">
        {[0, 1].map(copy => <span key={copy}>{BAND.map(word => <b key={word}>{word}<i>✦</i></b>)}</span>)}
      </div>
    </div>

    <div className="shell footer-grid">
      <div className="footer-cta">
        <h2>Not sure what to get?</h2>
        <p>Message us on WhatsApp and we&apos;ll help you choose.</p>
        <a className="button button-lime footer-whatsapp" href={STORE.whatsappLink} target="_blank" rel="noopener noreferrer">WhatsApp {STORE.phone} <i aria-hidden="true">↗</i></a>
      </div>
      <nav className="footer-col" aria-label="Shop">
        <h3>Shop</h3>
        {categories.map(item => <Link key={item.href} href={item.href}>{item.name}</Link>)}
      </nav>
      <nav className="footer-col" aria-label="Help">
        <h3>Help</h3>
        {HELP.map(([name, href]) => <Link key={href} href={href}>{name}</Link>)}
      </nav>
      <div className="footer-col footer-visit">
        <h3>Visit</h3>
        <p>{STORE.address}</p>
        <p>{STORE.hours}</p>
        <a href={STORE.mapLink} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
        <a href={STORE.phoneLink}>Call {STORE.phone}</a>
      </div>
    </div>

    <div className="shell footer-giant" aria-hidden="true">
      {[...`${BRAND.slice(0, -1)}`].map((letter, index) => <span key={index} style={{ "--i": index } as CSSProperties}>{letter}</span>)}
      <span className="is-x" style={{ "--i": BRAND.length - 1 } as CSSProperties}>{BRAND.slice(-1)}</span>
    </div>

    <div className="shell footer-legal">
      <p>© {BRAND}. For adults {MINIMUM_AGE} and over. This is a demo: products, specs and prices are placeholders, and nothing here is for sale.</p>
      <nav className="footer-legal-links" aria-label="Legal">
        {LEGAL.map(([name, href]) => <Link key={href} href={href}>{name}</Link>)}
        <span className="footer-age">{MINIMUM_AGE}+ only</span>
      </nav>
      <BackToTop />
    </div>
  </footer>;
}
