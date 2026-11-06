import type { Metadata } from "next";
import { PageHead } from "@/components/PageHead";
import { TermsList } from "./_sections/TermsList";

export const metadata: Metadata = { title: "Terms & conditions" };

export default function TermsPage() {
  return <>
    <PageHead eyebrow="Legal" title="Terms & conditions" text="Sample layout only. This text is not legal advice and must be replaced with terms reviewed by a lawyer before launch." />
    <TermsList />
  </>;
}
