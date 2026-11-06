import Link from "next/link";
import { BottleArt } from "@/app/art";
import { LIME } from "@/app/products";
import { DASHBOARD } from "../_shell/navItems";

export function AddProductCard() {
  return <section className="admin-card is-black">
    <h2>Add a new product.</h2>
    <p>Photo, price and options, all in one place.</p>
    <Link className="button button-white" href={`${DASHBOARD}/products?add=1`}>Add product</Link>
    <div className="admin-card-art" aria-hidden="true"><BottleArt color={LIME} /></div>
  </section>;
}
