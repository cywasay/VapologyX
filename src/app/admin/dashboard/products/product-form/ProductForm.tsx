"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ComboInput, Select } from "@/app/dropdown";
import { refreshShop } from "@/app/product-actions";
import { photosOf, shelfOf, shelves, type Category, type Product, type Spec } from "@/app/products";
import { DeleteProductDialog } from "./DeleteProductDialog";
import { FitsField } from "./FitsField";
import { OptionsField, type OptionRow } from "./OptionsField";
import { PhotosField } from "./PhotosField";
import { MAX_PRICE, MAX_STOCK, templateFor, type Photo } from "./productFormHelpers";
import { deleteProduct, saveProduct } from "./saveProduct";
import { SpecsField } from "./SpecsField";

// The side panel for adding a product or editing one.
export function ProductForm({ product, defaultCategory, onClose, onSaved }: {
  product: Product | null;
  defaultCategory: Category;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const confirmDialog = useRef<HTMLDialogElement>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState<Category>(product?.category ?? defaultCategory);
  const [type, setType] = useState(product?.type ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product?.stock == null ? "" : String(product.stock));
  const [description, setDescription] = useState(product?.description ?? "");
  const [specs, setSpecs] = useState<Spec[]>(product?.specs ?? templateFor(defaultCategory));
  const [options, setOptions] = useState<OptionRow[]>(product?.variants.map(option => ({ name: option.name, price: option.price === null ? "" : String(option.price) })) ?? []);
  const [fits, setFits] = useState<string[]>(product?.fits ?? []);
  const [isNew, setIsNew] = useState(Boolean(product?.badge));
  const [isPublished, setIsPublished] = useState(product?.is_published ?? true);
  const [photos, setPhotos] = useState<Photo[]>(() => product ? photosOf(product).map(url => ({ key: url, src: url, file: null })) : []);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { dialog.current?.showModal(); }, []);

  function changeCategory(next: Category) {
    setCategory(next);
    if (specs.every(spec => !spec.value.trim())) setSpecs(templateFor(next));
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
    };
    const failure = await saveProduct(product, photos, fields);
    if (failure) {
      setError(failure);
      setBusy(false);
      return;
    }
    const refreshed = await refreshShop().catch(() => ({ ok: false }));
    onSaved(refreshed.ok ? `${fields.name} saved. The shop is up to date.` : `${fields.name} saved. The shop may take up to an hour to show it.`);
  }

  async function remove() {
    if (!product) return;
    setBusy(true);
    setError("");
    const failure = await deleteProduct(product);
    if (failure) {
      setError(failure);
      setBusy(false);
      confirmDialog.current?.close();
      return;
    }
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
        <PhotosField photos={photos} onChange={setPhotos} disabled={busy} onProblem={setError} onPreparing={setPreparing} preview={{ name, category, type, color: product?.color ?? "#e8f78b" }} />

        <label className="field">Product name<input value={name} maxLength={120} onChange={event => setName(event.target.value)} autoFocus /></label>

        <div className="product-form-row">
          <label className="field">Category
            <Select value={category} options={shelves.map(shelf => ({ value: shelf.category, label: shelf.singular }))} onChange={next => changeCategory(next as Category)} />
          </label>
          <label className="field">Price (Rs)<input type="number" inputMode="numeric" min="0" step="1" value={price} onChange={event => setPrice(event.target.value)} /></label>
        </div>

        <label className="field">Stock (optional)
          <input type="number" inputMode="numeric" min="0" step="1" value={stock} placeholder="Not counted" onChange={event => setStock(event.target.value)} />
          <small className="field-hint">Leave it empty if you don&apos;t count stock. Enter 0 to mark the product as sold out.</small>
        </label>

        {showType && <label className="field">{category === "device" ? "Type" : "Flavor group"}
          <ComboInput value={type} suggestions={category === "device" ? ["Pod", "Box", "Pen"] : []} placeholder={category === "device" ? "Pod, Box or Pen" : "For example, Menthol"} onValue={setType} />
        </label>}

        <label className="field">Description<textarea rows={3} value={description} onChange={event => setDescription(event.target.value)} /></label>

        <OptionsField options={options} onChange={setOptions} />
        {category === "coil" && <FitsField fits={fits} onChange={setFits} />}
        <SpecsField specs={specs} onChange={setSpecs} />

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

    {product && <DeleteProductDialog dialog={confirmDialog} name={product.name} busy={busy} onDelete={remove} />}
  </dialog>;
}
