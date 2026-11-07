import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import { MINIMUM_AGE } from "@/lib/products";

export const metadata: Metadata = { title: "Questions & answers" };

const questions = [
  { q: "Who can buy here?", a: `This shop is for adults aged ${MINIMUM_AGE} and over.` },
  { q: "How do I order?", a: "Add what you want to your cart, go to checkout, and fill in your details. We message you to confirm." },
  { q: "How do I follow my order?", a: <>Open <Link href="/track">Track order</Link> and enter your order number and the mobile number you ordered with.</> },
  { q: "How can I pay?", a: "In cash when your order arrives or when you collect it, or by bank transfer. We send the account details after you order." },
  { q: "Which coils fit my device?", a: <>Use the coil finder on the <Link href="/#coil-finder">home page</Link>, or open a device and look for its compatible coils.</> },
  { q: "Can I pick my order up?", a: "Yes. Choose pickup at checkout. It is always free, and we message you when it is ready." },
  { q: "What if something is wrong with my order?", a: <>Please <Link href="/contact">contact the store</Link> with your order number. Placeholder text: the returns rules go here.</> },
];

export default function FaqPage() {
  return <>
    <PageHead eyebrow="Help" title="Questions & answers" text="Quick answers about ordering, paying and delivery." />
    <section className="shell page-body" aria-label="Frequently asked questions">
      <div className="panel-light faq keep-motion">
        {questions.map(item => <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>)}
      </div>
    </section>
  </>;
}
