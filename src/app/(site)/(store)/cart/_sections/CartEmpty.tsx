import Link from "next/link";
import { categories } from "@/components/categories";

export function CartEmpty() {
  return <div className="flow-empty panel-light">
    <h2>Your cart is empty.</h2>
    <p>Pick something from a shelf and it will wait for you here.</p>
    <div className="menu-tiles flow-shelves">
      {categories.map(item => <Link key={item.href} href={item.href}>{item.art}<span>{item.name}</span></Link>)}
    </div>
  </div>;
}
