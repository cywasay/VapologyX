import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCoilsFor, getProductBySlug, getProductsByIds, getStaticSlugs } from "@/lib/product-data";
import { CompatibleCoils } from "./_sections/CompatibleCoils";
import { MoreProducts } from "./_sections/MoreProducts";
import { ProductBreadcrumb } from "./_sections/ProductBreadcrumb";
import { ProductDetail } from "./_sections/ProductDetail";
import { WorksWith } from "./_sections/WorksWith";

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

  const [fittingCoils, fittingDevices] = await Promise.all([
    item.category === "device" ? getCoilsFor(item.id) : [],
    item.category === "coil" ? getProductsByIds(item.fits) : [],
  ]);

  return <>
    <ProductBreadcrumb item={item} />
    <ProductDetail item={item} fitDevices={fittingDevices} coilCount={fittingCoils.length} />
    <CompatibleCoils slug={slug} coils={fittingCoils} />
    <WorksWith slug={slug} devices={fittingDevices} />
    <MoreProducts item={item} />
  </>;
}
