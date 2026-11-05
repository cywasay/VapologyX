// Placeholder catalog: only the shop name is real. Replace the rest when the client supplies it.
export const BRAND = "VapologyX";
export const MINIMUM_AGE = 18;

export const LIME = "#e8f78b";
export const GRAPHITE = "#6f7176";
export const SILVER = "#c7cac5";

export const money = (value: number) => `Rs ${value.toLocaleString("en-US")}`;

export type Product = { id: string; name: string; price: number; color: string; badge?: string };
export type Device = Product & { kind: "pod" | "box" | "pen"; type: string };
export type Disposable = Product;
export type Bottle = Product & { family: string };
export type Coil = Product & { fits: string[] };
export type Listing = Device | Disposable | Bottle | Coil;

export const devices: Device[] = [
  { id: "d1", name: "Device 01", kind: "pod", type: "Pod", price: 5000, color: LIME },
  { id: "d2", name: "Device 02", kind: "box", type: "Box", price: 10000, color: LIME, badge: "New" },
  { id: "d3", name: "Device 03", kind: "pen", type: "Pen", price: 5000, color: GRAPHITE },
  { id: "d4", name: "Device 04", kind: "pod", type: "Pod", price: 5000, color: SILVER },
];

export const disposables: Disposable[] = [
  { id: "s1", name: "Disposable 01", price: 1500, color: LIME, badge: "New" },
  { id: "s2", name: "Disposable 02", price: 1500, color: GRAPHITE },
  { id: "s3", name: "Disposable 03", price: 1500, color: SILVER },
  { id: "s4", name: "Disposable 04", price: 1500, color: LIME },
  { id: "s5", name: "Disposable 05", price: 1500, color: GRAPHITE },
  { id: "s6", name: "Disposable 06", price: 1500, color: SILVER },
  { id: "s7", name: "Disposable 07", price: 1500, color: LIME },
  { id: "s8", name: "Disposable 08", price: 1500, color: GRAPHITE },
];

export const bottles: Bottle[] = [
  { id: "f1", name: "Bottle 01", family: "Category A", price: 1000, color: LIME, badge: "New" },
  { id: "f2", name: "Bottle 02", family: "Category A", price: 1000, color: SILVER },
  { id: "f3", name: "Bottle 03", family: "Category B", price: 1000, color: GRAPHITE },
  { id: "f4", name: "Bottle 04", family: "Category B", price: 1000, color: LIME },
  { id: "f5", name: "Bottle 05", family: "Category B", price: 1000, color: SILVER },
  { id: "f6", name: "Bottle 06", family: "Category C", price: 1000, color: GRAPHITE },
  { id: "f7", name: "Bottle 07", family: "Category C", price: 1000, color: LIME },
  { id: "f8", name: "Bottle 08", family: "Category D", price: 1000, color: SILVER },
];

export const coils: Coil[] = [
  { id: "c1", name: "Coil 01", price: 2000, color: LIME, fits: ["d1"] },
  { id: "c2", name: "Coil 02", price: 2000, color: SILVER, fits: ["d1", "d4"] },
  { id: "c3", name: "Coil 03", price: 2000, color: GRAPHITE, fits: ["d2"] },
  { id: "c4", name: "Coil 04", price: 2000, color: LIME, fits: ["d2", "d3"] },
];

export const shelves = [
  { name: "Devices", href: "/devices", items: devices as Listing[] },
  { name: "Disposables", href: "/disposables", items: disposables as Listing[] },
  { name: "Bottles", href: "/bottles", items: bottles as Listing[] },
  { name: "Coils", href: "/coils", items: coils as Listing[] },
];

export const catalog: Listing[] = shelves.flatMap(shelf => shelf.items);
export const deviceName = (id: string) => devices.find(device => device.id === id)?.name ?? id;
export const productSlug = (item: Product) => item.name.toLowerCase().replace(/\s+/g, "-");
export const productHref = (item: Product) => `/products/${productSlug(item)}`;
export const shelfOf = (item: Product) => shelves.find(shelf => shelf.items.some(other => other.id === item.id));
