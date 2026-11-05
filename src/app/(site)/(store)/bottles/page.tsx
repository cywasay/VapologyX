import type { Metadata } from "next";
import { BottleList } from "../../../product-lists";
import { ShopHead } from "../../../site-blocks";

export const metadata: Metadata = { title: "Bottles" };

export default function BottlesPage() {
  return <>
    <ShopHead current="Bottles" text="Placeholder text. A short line about the flavor range goes here." />
    <section className="shell page-body" aria-label="Bottles"><BottleList /></section>
  </>;
}
