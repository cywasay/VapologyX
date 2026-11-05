import Link from "next/link";
import { BottleArt, DeviceArt } from "../../art";
import { BottleList, DeviceList } from "../../product-lists";
import { BRAND, RED, WHITE, YELLOW } from "../../products";
import { categories, VisitBlock } from "../../site-blocks";
import { Ticker } from "../../ticker";

export default function Home() {
  return <>
    <section className="shell bento" aria-labelledby="hero-title">
      <div className="tile hero-copy">
        <span className="eyebrow">The {BRAND} flagship store</span>
        <h1 id="hero-title">Every device.<br />Every coil.<br /><em>Every flavor.</em></h1>
        <p>Short store introduction goes here. Replace this text with the real message from the shop.</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/devices">Shop devices</Link>
          <Link className="button button-outline" href="/contact">Visit the store</Link>
        </div>
      </div>
      <Link href="/devices" className="tile hero-display">
        <span className="hero-label">New arrivals <i aria-hidden="true">→</i></span>
        <div className="hero-item-side"><DeviceArt kind="pod" color={WHITE} /></div>
        <div className="hero-item-main"><DeviceArt kind="box" color={YELLOW} /></div>
        <div className="hero-item-side"><BottleArt color={RED} /></div>
      </Link>
      {categories.map(item => <Link key={item.href} href={item.href} className={`tile category ${item.tone}`}>
        <div><h2>{item.name}</h2><span>Shop now <i aria-hidden="true">→</i></span></div>
        {item.art}
      </Link>)}
    </section>

    <Ticker />

    <section className="shell section" aria-labelledby="featured-devices">
      <div className="section-heading"><h2 id="featured-devices">Featured devices</h2><Link className="view-all" href="/devices">View all devices <i aria-hidden="true">→</i></Link></div>
      <DeviceList limit={4} />
    </section>

    <section className="sheet" aria-labelledby="featured-bottles">
      <div className="shell">
        <div className="section-heading"><h2 id="featured-bottles">Popular bottles</h2><Link className="view-all" href="/bottles">View all bottles <i aria-hidden="true">→</i></Link></div>
        <BottleList limit={4} />
      </div>
    </section>

    <VisitBlock />
  </>;
}
