import { DeviceArt } from "@/components/art";
import { PageHead } from "@/components/PageHead";
import { BRAND, LIME } from "@/lib/products";

export function AboutHead() {
  return <PageHead eyebrow={`About ${BRAND}`} title="Genuine products, honest advice." text="VapologyX opened in 2024, built on our owner's experience in vaping since 2015. Seeing more and more fake and unreliable products in the market, we set out to make a store you can trust: genuine products, real product knowledge, and personal advice based on what you need." art={<DeviceArt kind="box" color={LIME} />} />;
}
