"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductArt } from "./art";
import { AddToCart } from "./product-lists";
import { GRAPHITE, SILVER, LIME, coils, deviceName, devices, money, productHref, productSlug, type Listing } from "./products";

const styles = [
  { name: "Style 01", color: LIME },
  { name: "Style 02", color: GRAPHITE },
  { name: "Style 03", color: SILVER },
];

function highlights(item: Listing) {
  if ("kind" in item) return [["0000 mAh", "Battery"], ["00 W", "Max output"], ["0 ml", "Capacity"]];
  if ("fits" in item) return [["0.0 Ω", "Resistance"], ["00-00 W", "Power range"], [String(item.fits.length), item.fits.length === 1 ? "Compatible device" : "Compatible devices"]];
  if ("family" in item) return [["00 ml", "Bottle size"], ["00/00", "Blend ratio"], [item.family, "Flavor group"]];
  return [["0000", "Puffs"], ["000 mAh", "Battery"], ["0 ml", "Capacity"]];
}

function specs(item: Listing) {
  if ("kind" in item) return [["Type", item.type], ["Battery", "0000 mAh"], ["Output", "00 W"], ["Capacity", "0 ml"], ["Charging", "Placeholder"], ["In the box", "Placeholder"]];
  if ("fits" in item) return [["Resistance", "0.0 Ω"], ["Power range", "00-00 W"], ["Pack size", "Placeholder"], ["Material", "Placeholder"]];
  if ("family" in item) return [["Flavor group", item.family], ["Bottle size", "00 ml"], ["Blend ratio", "00/00"], ["Flavor notes", "Placeholder"]];
  return [["Puffs", "0000"], ["Battery", "000 mAh"], ["Capacity", "0 ml"], ["Flavor notes", "Placeholder"]];
}

export function ProductDetail({ item }: { item: Listing }) {
  const [style, setStyle] = useState(styles.find(option => option.color === item.color) ?? styles[0]);
  // Ids include the slug because recently visited pages stay mounted but hidden.
  const slug = productSlug(item);
  const fittingCoils = "kind" in item ? coils.filter(coil => coil.fits.includes(item.id)).length : 0;

  return <>
    <div className="detail-bar">
      <div className="shell detail-bar-inner">
        <strong>{item.name}</strong>
        <nav aria-label={`${item.name} sections`}>
          <a href={`#${slug}-overview`}>Overview</a>
          <a href={`#${slug}-specs`}>Specs</a>
        </nav>
        <span className="detail-bar-price">{money(item.price)}</span>
      </div>
    </div>

    <section className="shell detail-grid" id={`${slug}-overview`} aria-label={`${item.name} overview`}>
      <div className="tile detail-image">
        {item.badge && <span className="badge">{item.badge}</span>}
        <ProductArt item={{ ...item, color: style.color }} />
      </div>
      <div className="tile detail-info">
        <h1>{item.name}</h1>
        <p className="detail-tagline">Short product tagline goes here.</p>
        <p className="detail-text">Placeholder text. A few lines about what makes this product worth buying go here.</p>
        <fieldset className="style-picker">
          <legend>Choose your style: <b>{style.name}</b></legend>
          <div>
            {styles.map(option => <label key={option.name} className={option.name === style.name ? "is-active" : ""}>
              <input type="radio" name={`${slug}-style`} checked={option.name === style.name} onChange={() => setStyle(option)} />
              <i style={{ background: option.color }} aria-hidden="true" />
              <span className="sr-only">{option.name}</span>
            </label>)}
          </div>
        </fieldset>
        <div className="detail-buy">
          <strong>{money(item.price)}</strong>
          <AddToCart item={item} />
        </div>
        {fittingCoils > 0 && <a className="text-link" href={`#${slug}-coils`}>{fittingCoils} compatible {fittingCoils === 1 ? "coil" : "coils"}</a>}
      </div>
    </section>

    <section className="shell detail-highlights" aria-label="Highlights">
      {highlights(item).map(([value, label]) => <div key={label} className="tile"><strong>{value}</strong><span>{label}</span></div>)}
    </section>

    <section className="shell section" id={`${slug}-specs`} aria-labelledby={`${slug}-specs-title`}>
      <div className="section-heading"><h2 id={`${slug}-specs-title`}>Specs</h2></div>
      <dl className="panel-light detail-specs">
        {specs(item).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        {"fits" in item && <div><dt>Fits</dt><dd className="detail-fits">{item.fits.map(id => {
          const device = devices.find(other => other.id === id);
          return device && <Link key={id} href={productHref(device)}>{deviceName(id)}</Link>;
        })}</dd></div>}
      </dl>
    </section>
  </>;
}
