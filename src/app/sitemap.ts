import type { MetadataRoute } from "next";
import { getSitemapProducts } from "@/lib/product-data";
import { siteUrl } from "@/lib/site-url";

const PAGES = ["", "/devices", "/disposables", "/bottles", "/coils", "/about", "/contact", "/shipping", "/faq", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const products = await getSitemapProducts();
  return [
    ...PAGES.map(path => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...products.map(item => ({ url: `${base}/products/${item.slug}`, lastModified: item.updated_at, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
