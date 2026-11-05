// Shared product types and helpers. The products themselves live in Supabase.
export const BRAND = "VapologyX";
export const MINIMUM_AGE = 18;

export const LIME = "#e8f78b";
export const GRAPHITE = "#6f7176";
export const SILVER = "#c7cac5";

export const PAGE_SIZE = 24;
export const PRODUCT_COLUMNS = "id,slug,name,category,type,price,description,specs,fits,variants,image_url,color,badge,is_published";

export type Category = "device" | "disposable" | "bottle" | "coil";
export type Spec = { label: string; value: string };
export type Variety = { name: string; price: number | null };
export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  type: string;
  price: number;
  description: string;
  specs: Spec[];
  fits: string[];
  variants: Variety[];
  image_url: string | null;
  color: string;
  badge: string | null;
  is_published: boolean;
};
export type ProductPage = { items: Product[]; total: number };

export const shelves: { category: Category; name: string; singular: string; href: string }[] = [
  { category: "device", name: "Devices", singular: "Device", href: "/devices" },
  { category: "disposable", name: "Disposables", singular: "Disposable", href: "/disposables" },
  { category: "bottle", name: "Bottles", singular: "Bottle", href: "/bottles" },
  { category: "coil", name: "Coils", singular: "Coil", href: "/coils" },
];

export const shelfOf = (category: Category) => shelves.find(shelf => shelf.category === category) ?? shelves[0];
export const money = (value: number) => `Rs ${value.toLocaleString("en-US")}`;
export const productHref = (product: Pick<Product, "slug">) => `/products/${product.slug}`;
export const varietyPrice = (product: Pick<Product, "price">, variety: Variety | null) => variety?.price ?? product.price;
