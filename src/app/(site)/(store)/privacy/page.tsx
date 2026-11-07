import type { Metadata } from "next";
import { PageHead } from "@/components/PageHead";
import { PolicyList } from "@/components/PolicyList";

export const metadata: Metadata = { title: "Privacy" };

const sections = [
  { title: "What we collect", text: "When you place an order we keep your name, mobile number, delivery address and any note you add. Your email is kept only if you give it." },
  { title: "Why we keep it", text: "To confirm and deliver your order, to contact you about it, and to let you track it with your order number and mobile number." },
  { title: "Your cart", text: "Your cart is saved in your own browser, on your own device. It is not sent to us until you place an order." },
  { title: "Who can see it", text: "Only the store team can see orders. We do not sell your details. Placeholder text: any delivery partners who receive your address are named here." },
  { title: "Your choices", text: "You can ask us to correct or remove your details by contacting the store. Placeholder text: how long orders are kept goes here." },
  { title: "Contact", text: "Placeholder text: who to contact about privacy goes here. This page is a sample and must be reviewed before launch." },
];

export default function PrivacyPage() {
  return <>
    <PageHead eyebrow="Legal" title="Privacy" text="How we handle the details you give us when you order. Sample text only: it must be reviewed before launch." />
    <PolicyList label="Privacy" sections={sections} />
  </>;
}
