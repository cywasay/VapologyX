"use client";

import { useState } from "react";
import { AddToCart } from "@/components/product/AddToCart";
import { PhoneBottomBar } from "@/components/store/PhoneBottomBar";
import { usePhoneLayout } from "@/lib/phone-layout";
import { isSoldOut, money, varietyPrice, type Product } from "@/lib/products";
import { DetailBar } from "./DetailBar";
import { DetailHighlights } from "./DetailHighlights";
import { DetailInfo } from "./DetailInfo";
import { DetailSpecs } from "./DetailSpecs";
import { ProductGallery } from "./ProductGallery";

// The top of a product page. It keeps the chosen option, because the bar and the buy box both show its price.
export function ProductDetail({ item, fitDevices, coilCount }: { item: Product; fitDevices: Product[]; coilCount: number }) {
  const [variety, setVariety] = useState(item.variants[0] ?? null);
  const phone = usePhoneLayout();
  const price = varietyPrice(item, variety);
  const hasSpecs = item.specs.length > 0 || fitDevices.length > 0;
  // Ids include the slug because recently visited pages stay mounted but hidden.
  const slug = item.slug;

  return <>
    <DetailBar item={item} slug={slug} price={price} hasSpecs={hasSpecs} />
    <section className="shell detail-grid" id={`${slug}-overview`} aria-label={`${item.name} overview`}>
      <ProductGallery item={item} soldOut={isSoldOut(item)} />
      <DetailInfo item={item} slug={slug} variety={variety} onVariety={setVariety} coilCount={coilCount} phone={phone} />
      {phone && <PhoneBottomBar label="Purchase options">
        <div>
          <strong>{money(price)}</strong>
          {variety && <a className="phone-purchase-option" href={`#${slug}-options`} aria-label={`Change option, ${variety.name}`}>{variety.name} <span aria-hidden="true">↑</span></a>}
        </div>
        <AddToCart item={item} variety={variety} compact />
      </PhoneBottomBar>}
    </section>
    <DetailHighlights specs={item.specs.slice(0, 3)} />
    {hasSpecs && <DetailSpecs item={item} slug={slug} fitDevices={fitDevices} />}
  </>;
}
