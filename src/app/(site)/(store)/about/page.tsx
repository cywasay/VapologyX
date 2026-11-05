import type { Metadata } from "next";
import { DeviceArt } from "../../../art";
import { BRAND, LIME } from "../../../products";
import { PageHead, VisitBlock } from "../../../site-blocks";

export const metadata: Metadata = { title: "About us" };

const points = [
  { title: "Every device", text: "Placeholder text. Say something about the range of devices in the shop." },
  { title: "Every coil", text: "Placeholder text. Say something about coils and compatibility." },
  { title: "Every flavor", text: "Placeholder text. Say something about the flavor selection." },
];

export default function AboutPage() {
  return <>
    <PageHead eyebrow={`About ${BRAND}`} title="A small shop that stocks it all." text="Placeholder text. The real story of the flagship store goes here: how it started, who runs it and what customers can expect." art={<DeviceArt kind="box" color={LIME} />} />
    <section className="shell page-body info-grid" aria-label="What we offer">
      {points.map(point => <div key={point.title} className="tile info-card"><h2>{point.title}</h2><p>{point.text}</p></div>)}
    </section>
    <VisitBlock />
  </>;
}
