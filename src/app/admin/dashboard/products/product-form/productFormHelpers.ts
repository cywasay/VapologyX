import type { Category, Spec } from "@/app/products";

export const BUCKET = "product-images";
export const MAX_PRICE = 2147483647;
export const MAX_STOCK = 100000;

// A photo in the form. One that is already in the shop has no file, and its src is its public address.
// A new one holds the shrunk file, and its src is a temporary address for the preview.
export type Photo = { key: string; src: string; file: File | null };

const specTemplates: Record<Category, string[]> = {
  device: ["Battery", "Max output", "Capacity", "Charging", "In the box"],
  disposable: ["Puffs", "Battery", "Capacity", "Flavor notes"],
  bottle: ["Bottle size", "Blend ratio", "Flavor notes"],
  coil: ["Resistance", "Power range", "Pack size", "Material"],
};
export const templateFor = (category: Category): Spec[] => specTemplates[category].map(label => ({ label, value: "" }));

export function slugify(name: string) {
  return name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export const randomSuffix = () => crypto.randomUUID().slice(0, 6);
const storagePath = (url: string | null) => url?.split(`/${BUCKET}/`)[1]?.split("?")[0] ?? null;
export const storagePaths = (urls: string[]) => urls.flatMap(url => storagePath(url) ?? []);
