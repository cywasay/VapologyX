"use client";

import { useState } from "react";
import { isSoldOut, varietyPrice, type Product } from "@/lib/products";
import { DetailBar } from "./DetailBar";
import { DetailHighlights } from "./DetailHighlights";
import { DetailInfo } from "./DetailInfo";
import { DetailSpecs } from "./DetailSpecs";
import { ProductGallery } from "./ProductGallery";

// The top of a product page. It keeps the chosen option, because the bar and the buy box both show its price.
export function ProductDetail({ item, fitDevices, coilCount }: { item: Product; fitDevices: Product[]; coilCount: number }) {
  const [variety, setVariety] = useState(item.variants[0] ?? null);
  const hasSpecs = item.specs.length > 0 || fitDevices.length > 0;
  // Ids include the slug because recently visited pages stay mounted but hidden.
  const slug = item.slug;

  return <>
    <DetailBar item={item} slug={slug} price={varietyPrice(item, variety)} hasSpecs={hasSpecs} />
    <section className="shell detail-grid" id={`${slug}-overview`} aria-label={`${item.name} overview`}>
      <ProductGallery item={item} soldOut={isSoldOut(item)} />
      <DetailInfo item={item} slug={slug} variety={variety} onVariety={setVariety} coilCount={coilCount} />
    </section>
    <DetailHighlights specs={item.specs.slice(0, 3)} />
    {hasSpecs && <DetailSpecs item={item} slug={slug} fitDevices={fitDevices} />}
  </>;
}
