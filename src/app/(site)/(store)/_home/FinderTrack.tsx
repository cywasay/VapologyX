import Link from "next/link";
import type { CSSProperties } from "react";
import { ProductArt } from "@/components/art";
import { ProductCard } from "@/components/product/ProductCard";
import { productHref, type Product } from "@/lib/products";

const COILS_SHOWN = 2;

// The chosen device tile with its coils dealt out beside it.
export function FinderTrack({ device, coils, round, seen, leaving }: { device: Product; coils: Product[]; round: number; seen: boolean; leaving: boolean }) {
  const fitting = coils.slice(0, COILS_SHOWN);
  return <div className={`finder-track ${seen ? "is-seen" : ""} ${leaving ? "is-leaving" : ""}`} data-updated={round > 0 || undefined}>
    <Link href={productHref(device)} className="finder-device" aria-label={`View ${device.name}`}>
      <div className="finder-device-inner" key={`${device.id}-${round}`}>
        <span className="finder-device-tag">Your device</span>
        <span className="finder-device-art"><ProductArt item={device} sizes="260px" /></span>
        <strong>{device.name}</strong>
        <em>View device <i aria-hidden="true">→</i></em>
      </div>
    </Link>
    {fitting.map((coil, index) => <ProductCard key={`${device.id}-${round}-${coil.id}`} item={coil} meta={`Fits ${device.name}`} style={{ "--k": index + 1 } as CSSProperties} />)}
    {fitting.length === 0 && <p key={`${device.id}-${round}`} className="finder-empty">No coils are listed for {device.name} yet.</p>}
  </div>;
}
