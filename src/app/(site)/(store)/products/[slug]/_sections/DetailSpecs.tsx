import Link from "next/link";
import { productHref, type Product } from "@/lib/products";

export function DetailSpecs({ item, slug, fitDevices }: { item: Product; slug: string; fitDevices: Product[] }) {
  return <section className="shell section" id={`${slug}-specs`} aria-labelledby={`${slug}-specs-title`}>
    <div className="section-heading"><h2 id={`${slug}-specs-title`}>Specs</h2></div>
    <dl className="panel-light detail-specs">
      {item.specs.map(spec => <div key={spec.label}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}
      {fitDevices.length > 0 && <div><dt>Fits</dt><dd className="detail-fits">{fitDevices.map(device => <Link key={device.id} href={productHref(device)}>{device.name}</Link>)}</dd></div>}
    </dl>
  </section>;
}
