import type { Metadata } from "next";
import { getDeviceOptions, getProducts } from "../../../product-data";
import { CoilList } from "../../../product-lists";
import { ShopHead } from "../../../site-blocks";

export const metadata: Metadata = { title: "Coils" };

export default async function CoilsPage() {
  const [initial, devices] = await Promise.all([getProducts("coil"), getDeviceOptions()]);
  return <>
    <ShopHead current="Coils" text="Select your device to see only the coils that fit it." />
    <section className="shell page-body" aria-label="Coils"><CoilList initial={initial} devices={devices} /></section>
  </>;
}
