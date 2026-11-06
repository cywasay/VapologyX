"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductArt } from "./art";
import { AddToCart } from "./product-lists";
import { fewLeft, isSoldOut, money, productHref, shelfOf, varietyPrice, type Product } from "./products";

export function ProductDetail({ item, fitDevices, coilCount }: { item: Product; fitDevices: Product[]; coilCount: number }) {
  const [variety, setVariety] = useState(item.variants[0] ?? null);
  const highlights = item.specs.slice(0, 3);
  const hasSpecs = item.specs.length > 0 || fitDevices.length > 0;
  const price = varietyPrice(item, variety);
  const soldOut = isSoldOut(item);
  const few = fewLeft(item);
  // Ids include the slug because recently visited pages stay mounted but hidden.
  const slug = item.slug;

  return <>
    <div className="detail-bar">
      <div className="shell detail-bar-inner">
        <strong>{item.name}</strong>
        <nav aria-label={`${item.name} sections`}>
          <a href={`#${slug}-overview`}>Overview</a>
          {hasSpecs && <a href={`#${slug}-specs`}>Specs</a>}
        </nav>
        <span className="detail-bar-price">{money(price)}</span>
      </div>
    </div>

    <section className="shell detail-grid" id={`${slug}-overview`} aria-label={`${item.name} overview`}>
      <div className="tile detail-image">
        {soldOut ? <span className="badge is-sold">Sold out</span> : item.badge && <span className="badge">{item.badge}</span>}
        <ProductArt item={item} alt={item.name} sizes="(max-width: 768px) 100vw, 60vw" />
      </div>
      <div className="tile detail-info">
        <h1>{item.name}</h1>
        <p className="detail-tagline">{item.type || shelfOf(item.category).singular}</p>
        {item.description && <p className="detail-text">{item.description}</p>}
        {item.variants.length > 0 && <fieldset className="variety-picker">
          <legend>Choose an option: <b>{variety?.name}</b></legend>
          <div>
            {item.variants.map(option => <label key={option.name} className={option.name === variety?.name ? "is-active" : ""}>
              <input type="radio" name={`${slug}-variety`} checked={option.name === variety?.name} onChange={() => setVariety(option)} />
              {option.name}
            </label>)}
          </div>
        </fieldset>}
        <div className="detail-buy">
          {soldOut
            ? <p className="stock-note is-sold">Sold out right now. <Link href="/contact">Ask the store</Link> when it&apos;s back.</p>
            : few && <p className="stock-note">Only {few} left in stock</p>}
          <strong>{money(price)}</strong>
          <AddToCart item={item} variety={variety} />
        </div>
        {coilCount > 0 && <a className="text-link" href={`#${slug}-coils`}>{coilCount} compatible {coilCount === 1 ? "coil" : "coils"}</a>}
      </div>
    </section>

    {highlights.length > 0 && <section className="shell detail-highlights" aria-label="Highlights">
      {highlights.map(spec => <div key={spec.label} className="tile"><strong>{spec.value}</strong><span>{spec.label}</span></div>)}
    </section>}

    {hasSpecs && <section className="shell section" id={`${slug}-specs`} aria-labelledby={`${slug}-specs-title`}>
      <div className="section-heading"><h2 id={`${slug}-specs-title`}>Specs</h2></div>
      <dl className="panel-light detail-specs">
        {item.specs.map(spec => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}
        {fitDevices.length > 0 && <div><dt>Fits</dt><dd className="detail-fits">{fitDevices.map(device => <Link key={device.id} href={productHref(device)}>{device.name}</Link>)}</dd></div>}
      </dl>
    </section>}
  </>;
}
