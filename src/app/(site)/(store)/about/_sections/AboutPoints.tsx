import Link from "next/link";
import type { ReactNode } from "react";
import { BottleArt, CoilArt, DeviceArt } from "@/components/art";
import { GRAPHITE, LIME, SILVER } from "@/lib/products";
import { getShelfCounts } from "../../_home/getShelfCounts";

// The range, in the owner's words, as tiles that lead to each shelf with a live count.
export async function AboutPoints() {
  const counts = await getShelfCounts();
  const points: { title: string; text: string; href: string; count: string; art: ReactNode; tone: string }[] = [
    { title: "Every device", text: "Refillable pod systems, rechargeable devices and disposables.", href: "/devices", count: `${counts.device + counts.disposable} devices`, art: <DeviceArt kind="pod" color={LIME} />, tone: "is-dark" },
    { title: "Every coil", text: "Different coil options, and help choosing the right coil for your device.", href: "/coils", count: `${counts.coil} coils`, art: <CoilArt color={SILVER} />, tone: "is-light" },
    { title: "Every flavour", text: "Fruit, ice, menthol, dessert and tobacco flavours, in different brands and nicotine strengths.", href: "/bottles", count: `${counts.bottle} bottles`, art: <BottleArt color={GRAPHITE} />, tone: "is-lime" },
  ];
  return <section className="shell section" aria-labelledby="about-range-title">
    <div className="section-heading"><h2 id="about-range-title">What we stock</h2></div>
    <div className="about-range">
      {points.map(point => <Link key={point.title} href={point.href} className={`about-range-card ${point.tone}`}>
        <span className="about-range-art" aria-hidden="true">{point.art}</span>
        <span className="about-range-count">{point.count}</span>
        <h3>{point.title}</h3>
        <p>{point.text}</p>
        <em>Shop now <i aria-hidden="true">→</i></em>
      </Link>)}
    </div>
  </section>;
}
