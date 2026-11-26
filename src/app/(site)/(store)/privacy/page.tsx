import type { Metadata } from "next";
import { PageHead } from "@/components/PageHead";
import { PolicyList } from "@/components/PolicyList";
import { STORE } from "@/lib/store-info";

export const metadata: Metadata = { title: "Privacy" };

const sections = [
  { title: "What we collect", text: "When you place an order we keep your name, mobile number, delivery address and any note you add. Your email is kept only if you give it." },
  { title: "Why we keep it", text: "To confirm and deliver your order, to contact you about it, and to let you track it with your order number and mobile number." },
  { title: "Loyalty Club", text: "If you join the Loyalty Club we keep your mobile number, your name if you give it, and your points history, so we can add and use your points. It is used only for the Loyalty Club and your orders." },
  { title: "Your cart", text: "Your cart is saved in your own browser, on your own device. It is not sent to us until you place an order." },
  { title: "Who can see it", text: "Only the store team can see orders. We do not sell your details. To deliver your order we share your name, number and address with the delivery service used for your area: Bykea, inDrive, TCS or Leopards Courier." },
  { title: "Your choices", text: "You can ask us to correct or remove your details by contacting the store. Order records are kept for 1 year." },
  { title: "Contact", text: `For any question about your personal details, call or WhatsApp us on ${STORE.phone}.` },
];

export default function PrivacyPage() {
  return <>
    <PageHead eyebrow="Legal" title="Privacy" text="How we handle the details you give us when you order." />
    <PolicyList label="Privacy" sections={sections} />
  </>;
}
