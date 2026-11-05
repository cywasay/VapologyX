import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "../../../../product-detail";
import { ProductGrid } from "../../../../product-lists";
import { catalog, coils, devices, productSlug, shelfOf } from "../../../../products";

// Waits for the product lookup so that an unknown product returns a real 404.
export const instant = false;

const findProduct = (slug: string) => catalog.find(item => productSlug(item) === slug);

export function generateStaticParams() {
  return catalog.map(item => ({ slug: productSlug(item) }));
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const item = findProduct((await props.params).slug);
  return { title: item?.name ?? "Product not found" };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const item = findProduct(slug);
  const shelf = item && shelfOf(item);
  if (!item || !shelf) notFound();

  const fittingCoils = "kind" in item ? coils.filter(coil => coil.fits.includes(item.id)) : [];
  const fittingDevices = "fits" in item ? devices.filter(device => item.fits.includes(device.id)) : [];
  const more = shelf.items.filter(other => other.id !== item.id).slice(0, 4);

  return <>
    <nav className="shell breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Home</Link><span aria-hidden="true">/</span>
      <Link href={shelf.href}>{shelf.name}</Link><span aria-hidden="true">/</span>
      <span aria-current="page">{item.name}</span>
    </nav>
    <ProductDetail item={item} />
    {fittingCoils.length > 0 && <section className="shell section" id={`${slug}-coils`} aria-labelledby={`${slug}-coils-title`}>
      <div className="section-heading"><h2 id={`${slug}-coils-title`}>Compatible coils</h2></div>
      <ProductGrid items={fittingCoils} />
    </section>}
    {fittingDevices.length > 0 && <section className="shell section" aria-labelledby={`${slug}-devices-title`}>
      <div className="section-heading"><h2 id={`${slug}-devices-title`}>Works with</h2></div>
      <ProductGrid items={fittingDevices} />
    </section>}
    <section className="shell section detail-last" aria-labelledby={`${slug}-more-title`}>
      <div className="section-heading"><h2 id={`${slug}-more-title`}>More {shelf.name.toLowerCase()}</h2><Link className="view-all" href={shelf.href}>View all <i aria-hidden="true">→</i></Link></div>
      <ProductGrid items={more} />
    </section>
  </>;
}
