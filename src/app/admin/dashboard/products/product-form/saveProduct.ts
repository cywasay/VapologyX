import { photosOf, type Category, type Product, type Spec, type Variety } from "@/lib/products";
import { createClient } from "@/utils/supabase/client";
import { BUCKET, randomSuffix, slugify, storagePaths, type Photo } from "./productFormHelpers";

export type ProductFields = {
  name: string;
  category: Category;
  type: string;
  price: number;
  stock: number | null;
  description: string;
  specs: Spec[];
  variants: Variety[];
  fits: string[];
  badge: string | null;
  is_published: boolean;
  barcode: string | null;
};

// Cost is owner-only, so it is saved in its own table and never sits on the product the shop reads. null leaves it as it is.
export type PrivateFields = { cost: number | null };
// The product itself was saved but its cost was not. The form closes as saved and tells the owner to add the cost again.
export const COST_FAILED = "The product was saved, but its cost couldn't be. Open it and add the cost again.";

// Uploads any new photos, then saves the product. Returns a plain-words problem, or an empty text when all went well.
// If saving fails, the photos uploaded for it are taken down again, and once it works, photos that were taken off the product are removed.
export async function saveProduct(product: Product | null, photos: Photo[], fields: ProductFields, secret: PrivateFields): Promise<string> {
  const supabase = createClient();
  const uploaded: string[] = [];
  const urls: string[] = [];
  const takeDown = async () => { if (uploaded.length > 0) await supabase.storage.from(BUCKET).remove(uploaded); };

  for (const photo of photos) {
    if (!photo.file) {
      urls.push(photo.src);
      continue;
    }
    const path = `${crypto.randomUUID()}.${photo.file.type === "image/jpeg" ? "jpg" : photo.file.type.split("/")[1]}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, photo.file, { contentType: photo.file.type, cacheControl: "31536000" });
    if (error) {
      await takeDown();
      return /row-level security|unauthorized/i.test(error.message) ? "Your account doesn't have permission to upload photos." : "A photo couldn't be uploaded. Please try again.";
    }
    uploaded.push(path);
    urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }

  const row = { ...fields, images: urls, image_url: urls[0] ?? null };
  let saveError: { code?: string; message?: string } | null = null;
  let savedRows = 0;
  let savedId = product?.id ?? "";
  const barcodeClash = () => saveError?.code === "23505" && /barcode/i.test(saveError.message ?? "");
  if (product) {
    const { data, error } = await supabase.from("products").update(row).eq("id", product.id).select("id");
    saveError = error;
    savedRows = data?.length ?? 0;
  } else {
    const base = slugify(fields.name) || "product";
    for (const slug of [base, `${base}-${randomSuffix()}`, `${base}-${randomSuffix()}`]) {
      const { data, error } = await supabase.from("products").insert({ ...row, slug }).select("id");
      saveError = error;
      savedRows = data?.length ?? 0;
      savedId = data?.[0]?.id ?? "";
      if (error?.code !== "23505" || barcodeClash()) break;
    }
  }

  if (saveError || savedRows === 0) {
    await takeDown();
    if (barcodeClash()) return "That barcode is already on another product.";
    return saveError?.code === "42501" || (!saveError && savedRows === 0) ? "Your account doesn't have permission to change products." : "The product couldn't be saved. Please try again.";
  }

  if (secret.cost !== null) {
    const { error } = await supabase.from("product_costs").upsert({ product_id: savedId, unit_cost: secret.cost });
    if (error) return COST_FAILED;
  }

  const kept = new Set(urls);
  const unused = storagePaths((product ? photosOf(product) : []).filter(url => !kept.has(url)));
  if (unused.length > 0) await supabase.storage.from(BUCKET).remove(unused);
  return "";
}

// Deletes a product and its photos. Returns a plain-words problem, or an empty text when all went well.
export async function deleteProduct(product: Product): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.from("products").delete().eq("id", product.id).select("id");
  if (error || !data?.length) return "The product couldn't be deleted. Please try again.";
  const paths = storagePaths(photosOf(product));
  if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
  return "";
}
