import Link from "next/link";
import { CategoryRail, CoilFinder, CountUp, HeroStage, HomeMotion, VisitPanel, type ShelfCounts } from "../../home-motion";
import { getCoilsFor, getProducts } from "../../product-data";
import { ProductGrid } from "../../product-lists";
import { BRAND, MINIMUM_AGE, shelves } from "../../products";
import { StoreDetails } from "../../site-blocks";

const STREETS = ["M-10 70 330 40", "M-10 170 330 150", "M90-10 120 250", "M230-10 210 250", "M-10 120 120 110"];

export default async function Home() {
  const [devices, disposables, bottles, coils] = await Promise.all([getProducts("device", 8), getProducts("disposable", 1), getProducts("bottle", 4), getProducts("coil", 1)]);
  const counts: ShelfCounts = { device: devices.total, disposable: disposables.total, bottle: bottles.total, coil: coils.total };
  const total = devices.total + disposables.total + bottles.total + coils.total;
  const fittingCoils = await Promise.all(devices.items.map(device => getCoilsFor(device.id)));
  const coilsByDevice = Object.fromEntries(devices.items.map((device, index) => [device.id, fittingCoils[index]]));

  return <HomeMotion>
    <section className="shell home-hero" aria-labelledby="hero-title">
      <div className="home-hero-panel">
        <div className="home-hero-copy">
          <span className="home-chip"><i aria-hidden="true" />The {BRAND} flagship store</span>
          <h1 id="hero-title" className="home-title"><span><span>Every device.</span></span><span><span>Every coil.</span></span><span><span><em>Every flavor.</em></span></span></h1>
          <p>Short store introduction goes here. Replace this text with the real message from the shop.</p>
          <div className="hero-actions">
            <Link className="button button-lime" href="/devices">Shop devices</Link>
            <Link className="button button-outline" href="/contact">Visit the store</Link>
          </div>
          <dl className="home-stats">
            <div><dt>Products</dt><dd><CountUp value={total} /></dd></div>
            <div><dt>Shelves</dt><dd>{shelves.length}</dd></div>
            <div><dt>Adults only</dt><dd>{MINIMUM_AGE}+</dd></div>
          </dl>
        </div>
        <HeroStage counts={counts} />
      </div>
    </section>

    <section className="shell section" aria-labelledby="shelves-title">
      <div className="section-heading home-reveal"><h2 id="shelves-title">Pick a shelf.</h2><p>Everything in the store sits on one of these four.</p></div>
      <CategoryRail counts={counts} />
    </section>

    <section className="shell section home-featured" aria-labelledby="featured-devices">
      <div className="section-heading home-reveal"><h2 id="featured-devices">Featured devices</h2><Link className="view-all" href="/devices">View all devices <i aria-hidden="true">→</i></Link></div>
      <ProductGrid items={devices.items.slice(0, 4)} />
    </section>

    {devices.items.length > 0 && <section className="shell section" aria-labelledby="finder-title">
      <CoilFinder devices={devices.items} coils={coilsByDevice} />
    </section>}

    <section className="sheet home-sheet home-featured" aria-labelledby="featured-bottles">
      <div className="shell">
        <div className="section-heading home-reveal"><h2 id="featured-bottles">Popular bottles</h2><Link className="view-all" href="/bottles">View all bottles <i aria-hidden="true">→</i></Link></div>
        <ProductGrid items={bottles.items} />
      </div>
    </section>

    <section className="shell home-visit" aria-labelledby="visit-title">
      <VisitPanel>
        <div className="home-visit-copy">
          <span className="home-chip is-light">Flagship store</span>
          <h2 id="visit-title">Come see every shelf in person.</h2>
          <p>Store visit text goes here. Replace it with what customers can expect in the shop.</p>
          <Link className="button button-dark" href="/contact">Contact the store</Link>
        </div>
        <div className="home-map" aria-hidden="true">
          <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice">
            <g className="home-map-streets">{STREETS.map(path => <path key={path} pathLength="100" d={path} />)}</g>
            <path className="home-map-route" pathLength="100" d="M40 214 112 160 168 168 218 112" />
            <g className="home-pin" transform="translate(218 112)">
              <ellipse className="home-pin-ripple" rx="7" ry="2.6" />
              <ellipse className="home-pin-ripple" rx="7" ry="2.6" />
              <g className="home-pin-drop">
                <path className="home-pin-shape" d="M0 0C-4-7-12-13-12-22a12 12 0 1 1 24 0C12-13 4-7 0 0Z" />
                <circle className="home-pin-hole" cy="-22" r="4.6" />
              </g>
            </g>
          </svg>
        </div>
        <StoreDetails />
      </VisitPanel>
    </section>
  </HomeMotion>;
}
