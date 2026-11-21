import type { Metadata } from "next";
import { PageHead } from "@/components/PageHead";
import { ContactDetails } from "./_sections/ContactDetails";
import { ContactForm } from "./_sections/ContactForm";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  return <>
    <PageHead eyebrow="Contact us" title="Come by or send a message." text="WhatsApp or call us for quick help, or visit us at Atrium Plaza, Zaraj Housing Society, Islamabad." />
    <section className="shell page-body contact-grid" aria-label="Contact">
      <ContactForm />
      <ContactDetails />
    </section>
  </>;
}
