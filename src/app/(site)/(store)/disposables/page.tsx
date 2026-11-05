import type { Metadata } from "next";
import { DisposableList } from "../../../product-lists";
import { ShopHead } from "../../../site-blocks";

export const metadata: Metadata = { title: "Disposables" };

export default function DisposablesPage() {
  return <>
    <ShopHead current="Disposables" text="Placeholder text. A short line about the disposable range goes here." />
    <section className="shell page-body" aria-label="Disposables"><DisposableList /></section>
  </>;
}
