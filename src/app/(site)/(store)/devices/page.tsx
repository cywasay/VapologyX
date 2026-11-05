import type { Metadata } from "next";
import { getProducts } from "../../../product-data";
import { ShelfList } from "../../../product-lists";
import { ShopHead } from "../../../site-blocks";

export const metadata: Metadata = { title: "Devices" };

export default async function DevicesPage() {
  const initial = await getProducts("device");
  return <>
    <ShopHead current="Devices" text="Placeholder text. A short line about the device range goes here." />
    <section className="shell page-body" aria-label="Devices"><ShelfList category="device" initial={initial} /></section>
  </>;
}
