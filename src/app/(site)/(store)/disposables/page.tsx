import type { Metadata } from "next";
import { getProducts } from "../../../product-data";
import { ShelfList } from "../../../product-lists";
import { ShopHead } from "../../../site-blocks";

export const metadata: Metadata = { title: "Disposables" };

export default async function DisposablesPage() {
  const initial = await getProducts("disposable");
  return <>
    <ShopHead current="Disposables" text="Placeholder text. A short line about the disposable range goes here." />
    <section className="shell page-body" aria-label="Disposables"><ShelfList category="disposable" initial={initial} /></section>
  </>;
}
