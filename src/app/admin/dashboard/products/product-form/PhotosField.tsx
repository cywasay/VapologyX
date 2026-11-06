"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ProductArt } from "@/components/art";
import { PHOTO_PICK_MAX_BYTES, PHOTO_TYPES, PHOTO_UPLOAD_MAX_BYTES, shrinkPhoto } from "@/lib/image-compress";
import { MAX_PHOTOS, type Category } from "@/lib/products";
import { Icon } from "../../../_shared/Icon";
import type { Photo } from "./productFormHelpers";

// The photos of a product: add, put in order, remove. The first one is the main photo.
export function PhotosField({ photos, onChange, disabled, onProblem, onPreparing, preview }: {
  photos: Photo[];
  onChange: (photos: Photo[] | ((current: Photo[]) => Photo[])) => void;
  disabled: boolean;
  onProblem: (text: string) => void;
  // Tells the form while photos are being shrunk, so it doesn't save without them.
  onPreparing: (preparing: boolean) => void;
  // What the drawing shows while there are no photos yet.
  preview: { name: string; category: Category; type: string; color: string };
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);

  // Temporary preview addresses are let go when the form closes.
  const latest = useRef(photos);
  useEffect(() => { latest.current = photos; });
  useEffect(() => () => {
    latest.current.forEach(photo => { if (photo.file) URL.revokeObjectURL(photo.src); });
  }, []);

  // Every photo is shrunk here, before anything is uploaded. Phone photos of several MB end up around 100 to 250 KB.
  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (chosen.length === 0) return;
    onProblem("");
    setPreparing(true);
    onPreparing(true);
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
    onChange(current => [...current, ...added]);
    setPreparing(false);
    onPreparing(false);
    onProblem(problem);
  }

  function move(from: number, to: number) {
    onChange(current => {
      if (to < 0 || to >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function remove(index: number) {
    const gone = photos[index];
    if (gone?.file) URL.revokeObjectURL(gone.src);
    onChange(photos.filter((_, position) => position !== index));
  }

  return <fieldset className="product-form-group">
    <legend>Photos</legend>
    <p>Up to {MAX_PHOTOS}. The first one is the main photo. JPG, PNG or WebP; big photos are shrunk for you.</p>
    {photos.length === 0
      ? <div className="photo-empty">
        <div className="product-form-preview"><ProductArt item={{ ...preview, image_url: null }} sizes="112px" /></div>
        <p>No photo yet. The shop shows a drawing until you add one.</p>
      </div>
      : <ul className="photo-list">
        {photos.map((photo, index) => <li key={photo.key}>
          <div className="photo-thumb"><Image className="art art-photo" src={photo.src} alt="" width={112} height={112} sizes="112px" unoptimized={photo.file !== null} /></div>
          {index === 0 && <span className="photo-main">Main</span>}
          <div className="photo-actions">
            <button type="button" aria-label={`Move photo ${index + 1} earlier`} disabled={disabled || index === 0} onClick={() => move(index, index - 1)}>‹</button>
            <button type="button" aria-label={`Move photo ${index + 1} later`} disabled={disabled || index === photos.length - 1} onClick={() => move(index, index + 1)}>›</button>
            <button type="button" className="is-remove" aria-label={`Remove photo ${index + 1}`} disabled={disabled} onClick={() => remove(index)}>×</button>
          </div>
        </li>)}
      </ul>}
    <input ref={fileInput} className="sr-only" type="file" accept={PHOTO_TYPES.join(",")} multiple tabIndex={-1} aria-label="Choose product photos" onChange={choose} />
    <button type="button" className="product-form-add" disabled={disabled || preparing || photos.length >= MAX_PHOTOS} onClick={() => fileInput.current?.click()}><Icon name="plus" />{preparing ? "Preparing photos…" : photos.length > 0 ? "Add more photos" : "Add photos"}</button>
  </fieldset>;
}
