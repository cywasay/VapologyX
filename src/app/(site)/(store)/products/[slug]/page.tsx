import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "../../../../product-detail";
import { getCoilsFor, getProductBySlug, getProducts, getProductsByIds, getStaticSlugs } from "../../../../product-data";
import { ProductGrid } from "../../../../product-lists";
import { shelfOf } from "../../../../products";

// Waits for the product lookup so that an unknown product returns a real 404.
export const instant = false;

// Pre-builds a sample of pages. Every other product page is built the first time it's opened.
export async function generateStaticParams() {
  const slugs = await getStaticSlugs(48);
  return (slugs.length ? slugs : ["no-products-yet"]).map(slug => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const item = await getProductBySlug((await props.params).slug);
  return { title: item?.name ?? "Product not found" };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const item = await getProductBySlug(slug);
  if (!item) notFound();

  const shelf = shelfOf(item.category);
  const [fittingCoils, fittingDevices, more] = await Promise.all([
    item.category === "device" ? getCoilsFor(item.id) : [],
    item.category === "coil" ? getProductsByIds(item.fits) : [],
    getProducts(item.category, 5),
  ]);

  return <>
    <nav className="shell breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Home</Link><span aria-hidden="true">/</span>
      <Link href={shelf.href}>{shelf.name}</Link><span aria-hidden="true">/</span>
      <span aria-current="page">{item.name}</span>
    </nav>
    <ProductDetail item={item} fitDevices={fittingDevices} coilCount={fittingCoils.length} />
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
      <ProductGrid items={more.items.filter(other => other.id !== item.id).slice(0, 4)} />
    </section>
  </>;
}
