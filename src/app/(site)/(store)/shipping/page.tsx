import type { Metadata } from "next";
import { PageHead } from "@/components/PageHead";
import { PolicyList } from "@/components/PolicyList";
import { money } from "@/lib/products";
import { getDeliveryRules } from "@/lib/store-settings";

export const metadata: Metadata = { title: "Shipping & delivery" };

const otherSections = [
  { title: "Pick up from the store", text: "Picking up from the store is always free. Choose pickup at checkout and we message you when your order is ready to collect." },
  { title: "Where we deliver", text: "Placeholder text: the cities and areas the store delivers to go here." },
  { title: "How long it takes", text: "Placeholder text: the usual delivery time for each area goes here. We confirm your order by message first." },
  { title: "Paying", text: "Pay in cash when your order arrives or when you collect it, or by bank transfer. For a transfer we send you the account details after you order." },
  { title: "Tracking", text: "Use your order number and mobile number on the Track order page to see where your order is." },
];

export default async function ShippingPage() {
  const { fee, freeFrom } = await getDeliveryRules();
  const sections = [{ title: "Delivery fee", text: `Delivery is ${money(fee)}. Orders of ${money(freeFrom)} or more are delivered free.` }, ...otherSections];
  return <>
    <PageHead eyebrow="Help" title="Shipping & delivery" text="What delivery costs, where it goes and how to follow your order." />
    <PolicyList label="Shipping and delivery" sections={sections} />
  </>;
}
