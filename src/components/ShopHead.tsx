import Link from "next/link";
import { categories } from "@/components/categories";
import { BRAND } from "@/lib/products";
import { PageHead } from "./PageHead";

// The banner of a shelf page, with tabs to the other shelves.
export function ShopHead({ current, text }: { current: string; text: string }) {
  const category = categories.find(item => item.name === current);
  return <PageHead eyebrow={`Shop ${BRAND}`} title={current} text={text} art={category?.art}>
    <nav className="tabs page-head-tabs" aria-label="Shop categories">
      {categories.map(item => <Link key={item.href} href={item.href} className={item.name === current ? "is-active" : ""} aria-current={item.name === current ? "page" : undefined}>{item.name}</Link>)}
    </nav>
  </PageHead>;
}
