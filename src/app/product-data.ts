import { cacheLife, cacheTag } from "next/cache";
import { PAGE_SIZE, PRODUCT_COLUMNS, type Category, type Product, type ProductPage } from "./products";
import { publicClient } from "../utils/supabase/public";

// Shop reads are cached and cleared by refreshShop in product-actions.ts whenever an admin saves.
const products = () => publicClient().from("products").select(PRODUCT_COLUMNS, { count: "exact" }).order("position");

function checked<T>(result: { data: T | null; error: { message: string } | null }) {
  if (result.error) throw new Error(`Couldn't load products: ${result.error.message}`);
  return result.data;
}

export async function getProducts(category: Category, limit = PAGE_SIZE): Promise<ProductPage> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  const result = await products().eq("category", category).range(0, limit - 1);
  return { items: (checked(result) ?? []) as unknown as Product[], total: result.count ?? 0 };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  return checked(await products().eq("slug", slug).maybeSingle()) as unknown as Product | null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  if (ids.length === 0) return [];
  return (checked(await products().in("id", ids)) ?? []) as unknown as Product[];
}

export async function getCoilsFor(deviceId: string): Promise<Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  return (checked(await products().eq("category", "coil").contains("fits", [deviceId]).limit(PAGE_SIZE)) ?? []) as unknown as Product[];
}

export async function getTypes(category: Category): Promise<string[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  const rows = checked(await publicClient().from("products").select("type").eq("category", category).order("type")) ?? [];
  return [...new Set((rows as { type: string }[]).map(row => row.type).filter(Boolean))];
}

export async function getDeviceOptions(): Promise<{ id: string; name: string }[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  return (checked(await publicClient().from("products").select("id,name").eq("category", "device").order("position")) ?? []) as { id: string; name: string }[];
}

export async function getStaticSlugs(limit: number): Promise<string[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  const rows = checked(await publicClient().from("products").select("slug").order("position").limit(limit)) ?? [];
  return (rows as { slug: string }[]).map(row => row.slug);
}
