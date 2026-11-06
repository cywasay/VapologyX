import type { Metadata } from "next";
import { CartView } from "./_sections/CartView";

export const metadata: Metadata = { title: "Your cart", robots: { index: false, follow: false } };

export default function CartPage() {
  return <CartView />;
}
