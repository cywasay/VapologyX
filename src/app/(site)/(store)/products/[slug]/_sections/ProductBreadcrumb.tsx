import Link from "next/link";
import { shelfOf, type Product } from "@/lib/products";

export function ProductBreadcrumb({ item }: { item: Product }) {
  const shelf = shelfOf(item.category);
  return <nav className="shell breadcrumb" aria-label="Breadcrumb">
    <Link href="/">Home</Link><span aria-hidden="true">/</span>
    <Link href={shelf.href}>{shelf.name}</Link><span aria-hidden="true">/</span>
    <span aria-current="page">{item.name}</span>
  </nav>;
}
