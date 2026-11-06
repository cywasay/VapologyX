import Link from "next/link";
import type { ReactNode } from "react";
import { BottleArt, CoilArt, DeviceArt, DisposableArt } from "./art";
import { BRAND, GRAPHITE, LIME, type Category } from "./products";

export const categories: { category: Category; href: string; name: string; blurb: string; tone: string; art: ReactNode }[] = [
  { category: "device", href: "/devices", name: "Devices", blurb: "Pods, boxes and pens for every style.", tone: "tone-light", art: <DeviceArt kind="box" color={LIME} /> },
  { category: "disposable", href: "/disposables", name: "Disposables", blurb: "Ready to go, with nothing to set up.", tone: "tone-gray", art: <DisposableArt color={GRAPHITE} /> },
  { category: "bottle", href: "/bottles", name: "Bottles", blurb: "Flavors sorted by taste, from fruit to menthol.", tone: "tone-lime", art: <BottleArt color={GRAPHITE} /> },
  { category: "coil", href: "/coils", name: "Coils", blurb: "Matched to the device you already own.", tone: "tone-dark", art: <CoilArt color={LIME} /> },
];

export function PageHead({ eyebrow, title, text, art, children }: { eyebrow: string; title: string; text: string; art?: ReactNode; children?: ReactNode }) {
  return <section className="shell page-head">
    <div className={`tile page-head-copy ${art ? "" : "is-wide"}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
      {children}
    </div>
    {art && <div className="tile page-head-art" aria-hidden="true">{art}</div>}
  </section>;
}

export function ShopHead({ current, text }: { current: string; text: string }) {
  const category = categories.find(item => item.name === current);
  return <PageHead eyebrow={`Shop ${BRAND}`} title={current} text={text} art={category?.art}>
    <nav className="tabs page-head-tabs" aria-label="Shop categories">
      {categories.map(item => <Link key={item.href} href={item.href} className={item.name === current ? "is-active" : ""} aria-current={item.name === current ? "page" : undefined}>{item.name}</Link>)}
    </nav>
  </PageHead>;
}

export function StoreDetails() {
  return <dl className="store-details">
    <div><dt>Address</dt><dd>Store address goes here</dd></div>
    <div><dt>Hours</dt><dd>Opening hours go here</dd></div>
    <div><dt>Contact</dt><dd>Phone or WhatsApp goes here</dd></div>
  </dl>;
}

export function VisitBlock() {
  return <section className="visit" aria-labelledby="visit-title">
    <div className="shell visit-inner">
      <div>
        <h2 id="visit-title">Visit the flagship store.</h2>
        <Link className="button button-dark" href="/contact">Contact us</Link>
      </div>
      <StoreDetails />
    </div>
  </section>;
}
