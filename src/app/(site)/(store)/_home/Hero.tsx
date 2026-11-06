import Link from "next/link";
import { BRAND, MINIMUM_AGE, shelves } from "@/lib/products";
import { CountUp } from "./CountUp";
import { getShelfCounts } from "./getShelfCounts";
import { HeroStage } from "./HeroStage";

export async function Hero() {
  const counts = await getShelfCounts();
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return <section className="shell home-hero" aria-labelledby="hero-title">
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
  </section>;
}
