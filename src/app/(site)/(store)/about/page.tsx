import type { Metadata } from "next";
import { StoreVisit } from "../_home/StoreVisit";
import { AboutHead } from "./_sections/AboutHead";
import { AboutPoints } from "./_sections/AboutPoints";
import { AboutStory } from "./_sections/AboutStory";
import { AboutValues } from "./_sections/AboutValues";

export const metadata: Metadata = { title: "About us" };

export default function AboutPage() {
  return <>
    <AboutHead />
    <AboutStory />
    <AboutValues />
    <AboutPoints />
    <StoreVisit />
  </>;
}
