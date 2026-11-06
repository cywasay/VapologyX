import type { Metadata } from "next";
import { VisitBlock } from "@/components/VisitBlock";
import { AboutHead } from "./_sections/AboutHead";
import { AboutPoints } from "./_sections/AboutPoints";

export const metadata: Metadata = { title: "About us" };

export default function AboutPage() {
  return <>
    <AboutHead />
    <AboutPoints />
    <VisitBlock />
  </>;
}
