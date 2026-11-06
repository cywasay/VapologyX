// Shared product types and helpers. The products themselves live in Supabase.
export const BRAND = "VapologyX";
export const MINIMUM_AGE = 18;

export const LIME = "#e8f78b";
export const GRAPHITE = "#6f7176";
export const SILVER = "#c7cac5";

export const PAGE_SIZE = 24;
export const PRODUCT_COLUMNS = "id,slug,name,category,type,price,description,specs,fits,variants,image_url,color,badge,is_published,stock";
// A product with this many left or fewer gets an "Only N left" label.
export const LOW_STOCK = 5;
// Most of one product a customer can put in a single cart line.
export const MAX_LINE_QUANTITY = 20;

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
  // How many are on the shelf. null means stock isn't counted, and 0 means sold out.
  stock: number | null;
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
export const isSoldOut = (product: Pick<Product, "stock">) => product.stock === 0;
// The number left, but only once it's low enough to be worth telling the customer.
export const fewLeft = (product: Pick<Product, "stock">) => product.stock != null && product.stock > 0 && product.stock <= LOW_STOCK ? product.stock : null;
export const orderLimit = (product: Pick<Product, "stock">) => Math.min(MAX_LINE_QUANTITY, product.stock ?? MAX_LINE_QUANTITY);
