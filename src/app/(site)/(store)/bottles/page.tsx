import type { Metadata } from "next";
import { getProducts, getTypes } from "../../../product-data";
import { BottleList } from "../../../product-lists";
import { ShopHead } from "../../../site-blocks";

export const metadata: Metadata = { title: "Bottles" };

export default async function BottlesPage() {
  const [initial, types] = await Promise.all([getProducts("bottle"), getTypes("bottle")]);
  return <>
    <ShopHead current="Bottles" text="Placeholder text. A short line about the flavor range goes here." />
    <section className="shell page-body" aria-label="Bottles"><BottleList initial={initial} types={types} /></section>
  </>;
}
