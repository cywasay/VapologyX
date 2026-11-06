import Link from "next/link";
import { categories } from "@/components/categories";

// Four tiles, one per shelf, for when there is nothing else to show.
export function ShelfLinks() {
  return <div className="menu-tiles flow-shelves">
    {categories.map(item => <Link key={item.href} href={item.href}>{item.art}<span>{item.name}</span></Link>)}
  </div>;
}
