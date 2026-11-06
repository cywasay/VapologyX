"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Icon } from "./admin-ui";
import { ProductArt } from "./art";
import { PHOTO_PICK_MAX_BYTES, PHOTO_TYPES, PHOTO_UPLOAD_MAX_BYTES, shrinkPhoto } from "./image-compress";
import { refreshShop } from "./product-actions";
import { MAX_PHOTOS, photosOf, shelfOf, shelves, type Category, type Product, type Spec } from "./products";
import { createClient } from "../utils/supabase/client";

const BUCKET = "product-images";
const MAX_PRICE = 2147483647;
const MAX_STOCK = 100000;

const specTemplates: Record<Category, string[]> = {
  device: ["Battery", "Max output", "Capacity", "Charging", "In the box"],
  disposable: ["Puffs", "Battery", "Capacity", "Flavor notes"],
  bottle: ["Bottle size", "Blend ratio", "Flavor notes"],
  coil: ["Resistance", "Power range", "Pack size", "Material"],
};
const templateFor = (category: Category): Spec[] => specTemplates[category].map(label => ({ label, value: "" }));

function slugify(name: string) {
  return name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const randomSuffix = () => crypto.randomUUID().slice(0, 6);
const storagePath = (url: string | null) => url?.split(`/${BUCKET}/`)[1]?.split("?")[0] ?? null;
const storagePaths = (urls: string[]) => urls.flatMap(url => storagePath(url) ?? []);

// A photo in the form. One that is already in the shop has no file, and its src is its public address.
// A new one holds the shrunk file, and its src is a temporary address for the preview.
type Photo = { key: string; src: string; file: File | null };

export function ProductForm({ product, defaultCategory, onClose, onSaved }: {
  product: Product | null;
  defaultCategory: Category;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const confirmDialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState<Category>(product?.category ?? defaultCategory);
  const [type, setType] = useState(product?.type ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product?.stock == null ? "" : String(product.stock));
  const [description, setDescription] = useState(product?.description ?? "");
  const [specs, setSpecs] = useState<Spec[]>(product?.specs ?? templateFor(defaultCategory));
  const [options, setOptions] = useState(product?.variants.map(option => ({ name: option.name, price: option.price === null ? "" : String(option.price) })) ?? []);
  const [fits, setFits] = useState<string[]>(product?.fits ?? []);
  const [isNew, setIsNew] = useState(Boolean(product?.badge));
  const [isPublished, setIsPublished] = useState(product?.is_published ?? true);
  const [photos, setPhotos] = useState<Photo[]>(() => product ? photosOf(product).map(url => ({ key: url, src: url, file: null })) : []);
  const [preparing, setPreparing] = useState(false);
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { dialog.current?.showModal(); }, []);

  // Temporary preview addresses are let go when the form closes.
  const latestPhotos = useRef(photos);
  useEffect(() => { latestPhotos.current = photos; });
  useEffect(() => () => {
    latestPhotos.current.forEach(photo => { if (photo.file) URL.revokeObjectURL(photo.src); });
  }, []);

  useEffect(() => {
    if (category !== "coil") return;
    createClient().from("products").select("id,name").eq("category", "device").order("position").limit(1000).then(({ data }) => {
      setDevices((data ?? []) as { id: string; name: string }[]);
    });
  }, [category]);

  function changeCategory(next: Category) {
    setCategory(next);
    if (specs.every(spec => !spec.value.trim())) setSpecs(templateFor(next));
  }

  // Every photo is shrunk here, before anything is uploaded. Phone photos of several MB end up around 100 to 250 KB.
  async function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (chosen.length === 0) return;
    setError("");
    setPreparing(true);
    const room = MAX_PHOTOS - photos.length;
    const added: Photo[] = [];
    let problem = chosen.length > room ? `A product can have up to ${MAX_PHOTOS} photos, so ${chosen.length - room} ${chosen.length - room === 1 ? "was" : "were"} left out.` : "";
    for (const file of chosen.slice(0, room)) {
      if (!PHOTO_TYPES.includes(file.type)) {
        problem = "Please choose JPG, PNG or WebP photos.";
        continue;
      }
      if (file.size > PHOTO_PICK_MAX_BYTES) {
        problem = "That photo is too large. The limit is 25 MB.";
        continue;
      }
      try {
        const small = await shrinkPhoto(file);
        if (small.size > PHOTO_UPLOAD_MAX_BYTES) {
          problem = "That photo is still too large after shrinking. Please choose a smaller one.";
          continue;
        }
        added.push({ key: crypto.randomUUID(), src: URL.createObjectURL(small), file: small });
      } catch {
        problem = "A photo couldn't be read. Please try a different one.";
      }
    }
    setPhotos(current => [...current, ...added]);
    setPreparing(false);
    setError(problem);
  }

  function movePhoto(from: number, to: number) {
    setPhotos(current => {
      if (to < 0 || to >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function removePhoto(index: number) {
    const gone = photos[index];
    if (gone?.file) URL.revokeObjectURL(gone.src);
    setPhotos(photos.filter((_, position) => position !== index));
  }

  function validate() {
    if (!name.trim()) return "Please enter a product name.";
    const amount = Number(price);
    if (price.trim() === "" || !Number.isInteger(amount) || amount < 0 || amount > MAX_PRICE) return "Please enter the price in whole rupees.";
    if (stock.trim() !== "" && (!Number.isInteger(Number(stock)) || Number(stock) < 0 || Number(stock) > MAX_STOCK)) return "Stock must be a whole number, or empty if you don't count it.";
    const named = options.filter(option => option.name.trim() || option.price.trim());
    if (named.some(option => !option.name.trim())) return "Every option needs a name.";
    if (new Set(named.map(option => option.name.trim().toLowerCase())).size !== named.length) return "Each option needs a different name.";
    if (named.some(option => option.price.trim() !== "" && (!Number.isInteger(Number(option.price)) || Number(option.price) < 0 || Number(option.price) > MAX_PRICE))) return "Option prices must be whole rupees.";
    return "";
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preparing) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    const supabase = createClient();

    // New photos go up first, in the order shown. If anything fails after that, they are taken down again.
    const uploaded: string[] = [];
    const urls: string[] = [];
    const takeDown = async () => { if (uploaded.length > 0) await supabase.storage.from(BUCKET).remove(uploaded); };
    for (const photo of photos) {
      if (!photo.file) {
        urls.push(photo.src);
        continue;
      }
      const path = `${crypto.randomUUID()}.${photo.file.type === "image/jpeg" ? "jpg" : photo.file.type.split("/")[1]}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, photo.file, { contentType: photo.file.type, cacheControl: "31536000" });
      if (uploadError) {
        await takeDown();
        setError(/row-level security|unauthorized/i.test(uploadError.message) ? "Your account doesn't have permission to upload photos." : "A photo couldn't be uploaded. Please try again.");
        setBusy(false);
        return;
      }
      uploaded.push(path);
      urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }

    const fields = {
      name: name.trim(),
      category,
      type: category === "device" || category === "bottle" ? type.trim() : shelfOf(category).singular,
      price: Number(price),
      stock: stock.trim() === "" ? null : Number(stock),
      description: description.trim(),
      specs: specs.map(spec => ({ label: spec.label.trim(), value: spec.value.trim() })).filter(spec => spec.label && spec.value),
      variants: options.filter(option => option.name.trim()).map(option => ({ name: option.name.trim(), price: option.price.trim() === "" ? null : Number(option.price) })),
      fits: category === "coil" ? fits : [],
      badge: isNew ? "New" : null,
      is_published: isPublished,
      images: urls,
      image_url: urls[0] ?? null,
    };

    let saveError: { code?: string } | null = null;
    let savedRows = 0;
    if (product) {
      const { data, error: updateError } = await supabase.from("products").update(fields).eq("id", product.id).select("id");
      saveError = updateError;
      savedRows = data?.length ?? 0;
    } else {
      const base = slugify(fields.name) || "product";
      for (const slug of [base, `${base}-${randomSuffix()}`, `${base}-${randomSuffix()}`]) {
        const { data, error: insertError } = await supabase.from("products").insert({ ...fields, slug }).select("id");
        saveError = insertError;
        savedRows = data?.length ?? 0;
        if (insertError?.code !== "23505") break;
      }
    }

    if (saveError || savedRows === 0) {
      await takeDown();
      setError(saveError?.code === "42501" || (!saveError && savedRows === 0) ? "Your account doesn't have permission to change products." : "The product couldn't be saved. Please try again.");
      setBusy(false);
      return;
    }

    // Photos that were taken off the product are removed from storage too.
    const kept = new Set(urls);
    const unused = storagePaths((product ? photosOf(product) : []).filter(url => !kept.has(url)));
    if (unused.length > 0) await supabase.storage.from(BUCKET).remove(unused);
    const refreshed = await refreshShop().catch(() => ({ ok: false }));
    onSaved(refreshed.ok ? `${fields.name} saved. The shop is up to date.` : `${fields.name} saved. The shop may take up to an hour to show it.`);
  }

  async function deleteProduct() {
    if (!product) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data, error: deleteError } = await supabase.from("products").delete().eq("id", product.id).select("id");
    if (deleteError || !data?.length) {
      setError("The product couldn't be deleted. Please try again.");
      setBusy(false);
      confirmDialog.current?.close();
      return;
    }
    const paths = storagePaths(photosOf(product));
    if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
    const refreshed = await refreshShop().catch(() => ({ ok: false }));
    onSaved(refreshed.ok ? `${product.name} deleted.` : `${product.name} deleted. The shop may take up to an hour to update.`);
  }

  const showType = category === "device" || category === "bottle";

  return <dialog ref={dialog} className="product-form" aria-labelledby="product-form-title" onClose={event => { if (event.target === event.currentTarget) onClose(); }} onCancel={event => { if (busy) event.preventDefault(); }}>
    <form onSubmit={save} noValidate>
      <div className="product-form-top">
        <h2 id="product-form-title">{product ? "Edit product" : "Add product"}</h2>
        <button type="button" className="cart-close" aria-label="Close" disabled={busy} onClick={() => dialog.current?.close()}>×</button>
      </div>

      <div className="product-form-body">
        <fieldset className="product-form-group">
          <legend>Photos</legend>
          <p>Up to {MAX_PHOTOS}. The first one is the main photo. JPG, PNG or WebP; big photos are shrunk for you.</p>
          {photos.length === 0
            ? <div className="photo-empty">
              <div className="product-form-preview"><ProductArt item={{ name, category, type, color: product?.color ?? "#e8f78b", image_url: null }} sizes="112px" /></div>
              <p>No photo yet. The shop shows a drawing until you add one.</p>
            </div>
            : <ul className="photo-list">
              {photos.map((photo, index) => <li key={photo.key}>
                <div className="photo-thumb"><Image className="art art-photo" src={photo.src} alt="" width={112} height={112} sizes="112px" unoptimized={photo.file !== null} /></div>
                {index === 0 && <span className="photo-main">Main</span>}
                <div className="photo-actions">
                  <button type="button" aria-label={`Move photo ${index + 1} earlier`} disabled={busy || index === 0} onClick={() => movePhoto(index, index - 1)}>‹</button>
                  <button type="button" aria-label={`Move photo ${index + 1} later`} disabled={busy || index === photos.length - 1} onClick={() => movePhoto(index, index + 1)}>›</button>
                  <button type="button" className="is-remove" aria-label={`Remove photo ${index + 1}`} disabled={busy} onClick={() => removePhoto(index)}>×</button>
                </div>
              </li>)}
            </ul>}
          <input ref={fileInput} className="sr-only" type="file" accept={PHOTO_TYPES.join(",")} multiple tabIndex={-1} aria-label="Choose product photos" onChange={choosePhotos} />
          <button type="button" className="product-form-add" disabled={busy || preparing || photos.length >= MAX_PHOTOS} onClick={() => fileInput.current?.click()}><Icon name="plus" />{preparing ? "Preparing photos…" : photos.length > 0 ? "Add more photos" : "Add photos"}</button>
        </fieldset>

        <label className="field">Product name<input value={name} maxLength={120} onChange={event => setName(event.target.value)} autoFocus /></label>

        <div className="product-form-row">
          <label className="field">Category
            <select value={category} onChange={event => changeCategory(event.target.value as Category)}>
              {shelves.map(shelf => <option key={shelf.category} value={shelf.category}>{shelf.singular}</option>)}
            </select>
          </label>
          <label className="field">Price (Rs)<input type="number" inputMode="numeric" min="0" step="1" value={price} onChange={event => setPrice(event.target.value)} /></label>
        </div>

        <label className="field">Stock (optional)
          <input type="number" inputMode="numeric" min="0" step="1" value={stock} placeholder="Not counted" onChange={event => setStock(event.target.value)} />
          <small className="field-hint">Leave it empty if you don&apos;t count stock. Enter 0 to mark the product as sold out.</small>
        </label>

        {showType && <label className="field">{category === "device" ? "Type" : "Flavor group"}
          <input value={type} list={category === "device" ? "device-types" : undefined} placeholder={category === "device" ? "Pod, Box or Pen" : "For example, Menthol"} onChange={event => setType(event.target.value)} />
          <datalist id="device-types"><option value="Pod" /><option value="Box" /><option value="Pen" /></datalist>
        </label>}

        <label className="field">Description<textarea rows={3} value={description} onChange={event => setDescription(event.target.value)} /></label>

        <fieldset className="product-form-group">
          <legend>Options</legend>
          <p>Add flavors, colors or sizes here. Leave the price empty to use the main price.</p>
          {options.map((option, index) => <div key={index} className="product-form-pair">
            <input aria-label={`Option ${index + 1} name`} placeholder="Name" value={option.name} onChange={event => setOptions(options.map((other, i) => i === index ? { ...other, name: event.target.value } : other))} />
            <input aria-label={`Option ${index + 1} price`} type="number" inputMode="numeric" min="0" step="1" placeholder="Price (optional)" value={option.price} onChange={event => setOptions(options.map((other, i) => i === index ? { ...other, price: event.target.value } : other))} />
            <button type="button" className="product-form-remove" aria-label={`Remove option ${index + 1}`} onClick={() => setOptions(options.filter((_, i) => i !== index))}>×</button>
          </div>)}
          <button type="button" className="product-form-add" onClick={() => setOptions([...options, { name: "", price: "" }])}><Icon name="plus" />Add option</button>
        </fieldset>

        {category === "coil" && <fieldset className="product-form-group">
          <legend>Fits these devices</legend>
          {devices.length === 0 && <p>Loading devices…</p>}
          <div className="product-form-checks">
            {devices.map(device => <label key={device.id}><input type="checkbox" checked={fits.includes(device.id)} onChange={event => setFits(event.target.checked ? [...fits, device.id] : fits.filter(id => id !== device.id))} />{device.name}</label>)}
          </div>
        </fieldset>}

        <fieldset className="product-form-group">
          <legend>Specs</legend>
          <p>The first three appear as big numbers on the product page. Empty rows are skipped.</p>
          {specs.map((spec, index) => <div key={index} className="product-form-pair">
            <input aria-label={`Spec ${index + 1} name`} placeholder="Name" value={spec.label} onChange={event => setSpecs(specs.map((other, i) => i === index ? { ...other, label: event.target.value } : other))} />
            <input aria-label={`Spec ${index + 1} value`} placeholder="Value" value={spec.value} onChange={event => setSpecs(specs.map((other, i) => i === index ? { ...other, value: event.target.value } : other))} />
            <button type="button" className="product-form-remove" aria-label={`Remove spec ${index + 1}`} onClick={() => setSpecs(specs.filter((_, i) => i !== index))}>×</button>
          </div>)}
          <button type="button" className="product-form-add" onClick={() => setSpecs([...specs, { label: "", value: "" }])}><Icon name="plus" />Add spec</button>
        </fieldset>

        <div className="product-form-checks">
          <label><input type="checkbox" checked={isPublished} onChange={event => setIsPublished(event.target.checked)} />Visible in the shop</label>
          <label><input type="checkbox" checked={isNew} onChange={event => setIsNew(event.target.checked)} />Show a &ldquo;New&rdquo; label</label>
        </div>
      </div>

      <div className="product-form-foot">
        <p className="form-status is-error" role="alert">{error}</p>
        <div>
          {product && <button type="button" className="button button-outline product-form-delete" disabled={busy} onClick={() => confirmDialog.current?.showModal()}>Delete</button>}
          <button type="button" className="button button-outline" disabled={busy} onClick={() => dialog.current?.close()}>Cancel</button>
          <button type="submit" className="button button-primary" disabled={busy || preparing}>{busy ? "Saving…" : product ? "Save changes" : "Add product"}</button>
        </div>
      </div>
    </form>

    {product && <dialog ref={confirmDialog} className="confirm-dialog" aria-labelledby="delete-title" aria-describedby="delete-text" onClick={event => { if (event.target === event.currentTarget && !busy) confirmDialog.current?.close(); }}>
      <div className="confirm-inner">
        <h2 id="delete-title">Delete this product?</h2>
        <p id="delete-text">{product.name} will be removed from the shop for good. This can&apos;t be undone.</p>
        <div className="confirm-actions">
          <button className="button button-outline" autoFocus disabled={busy} onClick={() => confirmDialog.current?.close()}>Cancel</button>
          <button className="button button-danger" disabled={busy} onClick={deleteProduct}>{busy ? "Deleting…" : "Delete"}</button>
        </div>
      </div>
    </dialog>}
  </dialog>;
}
