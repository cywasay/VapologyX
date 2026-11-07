import type { Metadata } from "next";
import { PageHead } from "@/components/PageHead";
import { PolicyList } from "@/components/PolicyList";
import { DELIVERY_FEE, FREE_DELIVERY_FROM } from "@/lib/orders";
import { money } from "@/lib/products";

export const metadata: Metadata = { title: "Shipping & delivery" };

const sections = [
  { title: "Delivery fee", text: `Delivery is ${money(DELIVERY_FEE)}. Orders of ${money(FREE_DELIVERY_FROM)} or more are delivered free.` },
  { title: "Pick up from the store", text: "Picking up from the store is always free. Choose pickup at checkout and we message you when your order is ready to collect." },
  { title: "Where we deliver", text: "Placeholder text: the cities and areas the store delivers to go here." },
  { title: "How long it takes", text: "Placeholder text: the usual delivery time for each area goes here. We confirm your order by message first." },
  { title: "Paying", text: "Pay in cash when your order arrives or when you collect it, or by bank transfer. For a transfer we send you the account details after you order." },
  { title: "Tracking", text: "Use your order number and mobile number on the Track order page to see where your order is." },
];

export default function ShippingPage() {
  return <>
    <PageHead eyebrow="Help" title="Shipping & delivery" text="What delivery costs, where it goes and how to follow your order." />
    <PolicyList label="Shipping and delivery" sections={sections} />
  </>;
}
