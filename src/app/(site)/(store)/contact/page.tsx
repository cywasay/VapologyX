import type { Metadata } from "next";
import { ContactForm } from "../../../contact-form";
import { PageHead, StoreDetails } from "../../../site-blocks";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  return <>
    <PageHead eyebrow="Contact us" title="Come by or send a message." text="Placeholder text. A short line about the best way to reach the shop goes here." />
    <section className="shell page-body contact-grid" aria-label="Contact">
      <ContactForm />
      <div className="tile contact-details">
        <h2>Find the store</h2>
        <StoreDetails />
      </div>
    </section>
  </>;
}
