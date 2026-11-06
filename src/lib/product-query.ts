import { PAGE_SIZE, PRODUCT_COLUMNS, shelves, type Category, type Product, type ProductPage } from "./products";
import { publicClient } from "@/utils/supabase/public";

// What a visitor has asked for on a shelf or in a search. It lives in the page address, so a link or a reload keeps it.
export const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;
export type Sort = (typeof SORTS)[number]["value"];

export type Query = {
  // Words typed into search. Search only.
  text: string;
  // Limits a search to one shelf. Search only.
  shelf: Category | "";
  // Device type or flavor group. Shelves only.
  type: string;
  // A device id, to show only the coils that fit it. Shelves only.
  fits: string;
  inStock: boolean;
  min: number | null;
  max: number | null;
  sort: Sort;
};

export const DEFAULT_QUERY: Query = { text: "", shelf: "", type: "", fits: "", inStock: false, min: null, max: null, sort: "featured" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A whole number typed by a person, or null when it isn't one. Commas and spaces are ignored.
export function whole(text: string | null | undefined) {
  const cleaned = (text ?? "").replace(/[,\s]/g, "");
  return /^\d{1,9}$/.test(cleaned) ? Number(cleaned) : null;
}

type Params = { get(name: string): string | null };

export function readQuery(params: Params): Query {
  const shelf = params.get("shelf");
  const sort = params.get("sort");
  const fits = params.get("fits") ?? "";
  return {
    text: (params.get("q") ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
    shelf: shelves.find(item => item.category === shelf)?.category ?? "",
    type: (params.get("type") ?? "").slice(0, 60),
    fits: UUID.test(fits) ? fits.toLowerCase() : "",
    inStock: params.get("stock") === "1",
    min: whole(params.get("min")),
    max: whole(params.get("max")),
    sort: SORTS.find(item => item.value === sort)?.value ?? "featured",
  };
}

// A shelf ignores the search-only parts of the address, and search ignores the shelf-only parts.
export function limitQuery(query: Query, search: boolean): Query {
  return search ? { ...query, type: "", fits: "" } : { ...query, text: "", shelf: "" };
}

// The address form of a query. It is empty when nothing has been asked for, and the same query always gives the same text.
export function writeQuery(query: Query) {
  const params = new URLSearchParams();
  if (query.text) params.set("q", query.text);
  if (query.shelf) params.set("shelf", query.shelf);
  if (query.type) params.set("type", query.type);
  if (query.fits) params.set("fits", query.fits);
  if (query.inStock) params.set("stock", "1");
  if (query.min !== null) params.set("min", String(query.min));
  if (query.max !== null) params.set("max", String(query.max));
  if (query.sort !== "featured") params.set("sort", query.sort);
  return params.toString();
}

// Characters that would change the meaning of a search term are dropped.
const words = (text: string) => text.split(/\s+/).map(word => word.replace(/[*%_\\"(),]/g, "").slice(0, 40)).filter(Boolean).slice(0, 6);

// A word matches a product when it is in the name, type or description, or when it names the product's shelf ("bottles").
function matches(word: string) {
  const conditions = ["name", "type", "description"].map(column => `${column}.ilike."*${word}*"`);
  const lower = word.toLowerCase();
  const shelf = shelves.find(item => item.name.toLowerCase() === lower || item.singular.toLowerCase() === lower);
  if (shelf) conditions.push(`category.eq.${shelf.category}`);
  return conditions.join(",");
}

// Reads products the way a signed-out visitor sees them. The key is a query written by writeQuery.
export async function fetchProducts(scope: Category | null, key: string, from: number, size = PAGE_SIZE): Promise<ProductPage> {
  const query = readQuery(new URLSearchParams(key));
  const terms = words(query.text);
  // Words made only of dropped characters (for example "%%") can't match anything.
  if (query.text && terms.length === 0) return { items: [], total: 0 };
  let request = publicClient().from("products").select(PRODUCT_COLUMNS, { count: "exact" });
  if (scope) request = request.eq("category", scope);
  if (query.type) request = request.eq("type", query.type);
  if (query.fits) request = request.contains("fits", [query.fits]);
  if (query.inStock) request = request.or("stock.is.null,stock.gt.0");
  if (query.min !== null) request = request.gte("price", query.min);
  if (query.max !== null) request = request.lte("price", query.max);
  for (const word of terms) request = request.or(matches(word));
  if (query.sort === "newest") request = request.order("created_at", { ascending: false }).order("position", { ascending: false });
  else if (query.sort === "price-asc") request = request.order("price").order("position");
  else if (query.sort === "price-desc") request = request.order("price", { ascending: false }).order("position");
  else request = request.order("position");
  const { data, count, error } = await request.range(from, from + size - 1);
  if (error) throw error;
  return { items: (data ?? []) as unknown as Product[], total: count ?? 0 };
}

export const searchProducts = (text: string, size: number) => fetchProducts(null, writeQuery({ ...DEFAULT_QUERY, text }), 0, size);
