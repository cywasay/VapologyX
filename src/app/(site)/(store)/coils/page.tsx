import type { Metadata } from "next";
import { CoilList } from "../../../product-lists";
import { ShopHead } from "../../../site-blocks";

export const metadata: Metadata = { title: "Coils" };

export default function CoilsPage() {
  return <>
    <ShopHead current="Coils" text="Select your device to see only the coils that fit it." />
    <section className="shell page-body" aria-label="Coils"><CoilList /></section>
  </>;
}
