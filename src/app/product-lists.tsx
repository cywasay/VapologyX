"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductArt } from "./art";
import { bottles, coils, deviceName, devices, disposables, money, productHref, type Listing } from "./products";
import { useStore } from "./store-shell";

function productMeta(item: Listing) {
  if ("type" in item) return item.type;
  if ("fits" in item) return `Fits ${item.fits.map(deviceName).join(", ")}`;
  if ("family" in item) return item.family;
  return "Disposable";
}

function productSummary(item: Listing) {
  if ("kind" in item) return <>0000 mAh <span>/</span> 00 W</>;
  if ("fits" in item) return <>0.0 Ω <span>/</span> 00-00 W</>;
  return "Product description goes here.";
}

// Shared card for every category page, wired to the cart in StoreShell.
function ProductCard({ item }: { item: Listing }) {
  const { cart, add, setFit } = useStore();
  const href = productHref(item);
  return <article className="product">
    <Link href={href} className="product-image" aria-label={`View ${item.name}`} tabIndex={-1}>
      {item.badge && <span className="badge">{item.badge}</span>}
      <ProductArt item={item} />
    </Link>
    <span className="product-meta">{productMeta(item)}</span>
    <h3><Link href={href}>{item.name}</Link></h3>
    <p className="product-specs">{productSummary(item)}</p>
    {"kind" in item && <Link className="text-link" href="/coils" onClick={() => setFit(item.id)}>View compatible coils</Link>}
    <div className="product-buy">
      <strong>{money(item.price)}</strong>
      <button className="button button-add" onClick={() => add(item.id)} aria-label={`Add ${item.name} to cart`}>{cart[item.id] ? `In cart: ${cart[item.id]}` : "Add +"}</button>
    </div>
  </article>;
}

export function ProductGrid({ items }: { items: Listing[] }) {
  return <div className="product-grid">{items.map(item => <ProductCard key={item.id} item={item} />)}</div>;
}

function FilterTabs({ label, options, value, onChange, display = (option: string) => option }: { label: string; options: string[]; value: string; onChange: (value: string) => void; display?: (option: string) => string }) {
  return <div className="tabs" role="group" aria-label={label}>
    {options.map(option => <button key={option} className={value === option ? "is-active" : ""} aria-pressed={value === option} onClick={() => onChange(option)}>{display(option)}</button>)}
  </div>;
}

export function DeviceList({ limit }: { limit?: number }) {
  return <ProductGrid items={devices.slice(0, limit)} />;
}

export function DisposableList() {
  return <ProductGrid items={disposables} />;
}

export function BottleList({ limit }: { limit?: number }) {
  const [family, setFamily] = useState("All");
  const families = ["All", ...new Set(bottles.map(bottle => bottle.family))];
  const shown = bottles.filter(bottle => family === "All" || bottle.family === family);
  return <>
    {!limit && <FilterTabs label="Filter bottles" options={families} value={family} onChange={setFamily} />}
    <ProductGrid items={shown.slice(0, limit)} />
  </>;
}

export function CoilList() {
  const { fit, setFit } = useStore();
  const shown = coils.filter(coil => fit === "All" || coil.fits.includes(fit));
  return <>
    <FilterTabs label="Filter coils by device" options={["All", ...devices.map(device => device.id)]} value={fit} onChange={setFit} display={id => id === "All" ? "All devices" : deviceName(id)} />
    <ProductGrid items={shown} />
  </>;
}

export function AddToCart({ item }: { item: Listing }) {
  const { cart, add } = useStore();
  return <button className="button button-primary detail-add" onClick={() => add(item.id)}>{cart[item.id] ? `In cart: ${cart[item.id]}. Add another` : "Add to cart"}</button>;
}
