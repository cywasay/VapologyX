import type { Metadata } from "next";
import { DeviceList } from "../../../product-lists";
import { ShopHead } from "../../../site-blocks";

export const metadata: Metadata = { title: "Devices" };

export default function DevicesPage() {
  return <>
    <ShopHead current="Devices" text="Placeholder text. A short line about the device range goes here." />
    <section className="shell page-body" aria-label="Devices"><DeviceList /></section>
  </>;
}
