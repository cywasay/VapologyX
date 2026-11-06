import { DeviceArt } from "@/components/art";
import { PageHead } from "@/components/PageHead";
import { BRAND, LIME } from "@/lib/products";

export function AboutHead() {
  return <PageHead eyebrow={`About ${BRAND}`} title="A small shop that stocks it all." text="Placeholder text. The real story of the flagship store goes here: how it started, who runs it and what customers can expect." art={<DeviceArt kind="box" color={LIME} />} />;
}
