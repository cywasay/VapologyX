"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ProductArt } from "@/components/art";
import { PHONE_MEDIA } from "@/lib/phone-media";
import { photosOf, saleTag, type Product } from "@/lib/products";

// A swipe of at least this many pixels moves to the next or previous photo.
const SWIPE = 40;
const PHOTO_SIZES = `${PHONE_MEDIA} calc(100vw - 48px), (max-width: 768px) 100vw, 60vw`;

// The photos of a product: one large photo with arrows, a swipe on touch screens, and small pictures to jump between them.
// A product without photos shows its drawing, as before.
export function ProductGallery({ item, soldOut }: { item: Product; soldOut: boolean }) {
  const photos = photosOf(item);
  const [index, setIndex] = useState(0);
  const dragStart = useRef<number | null>(null);
  const many = photos.length > 1;
  const current = Math.min(index, Math.max(photos.length - 1, 0));
  const show = (next: number) => setIndex((next + photos.length) % photos.length);

  return <div className="detail-media">
    <div
      className={`tile detail-image ${photos.length > 0 ? "has-photos" : ""}`}
      role={many ? "group" : undefined}
      aria-roledescription={many ? "carousel" : undefined}
      aria-label={many ? `${item.name} photos` : undefined}
      onPointerDown={many ? event => { dragStart.current = event.clientX; } : undefined}
      onPointerUp={many ? event => {
        const start = dragStart.current;
        dragStart.current = null;
        if (start !== null && Math.abs(event.clientX - start) >= SWIPE) show(current + (event.clientX < start ? 1 : -1));
      } : undefined}
      onPointerCancel={many ? () => { dragStart.current = null; } : undefined}
    >
      {soldOut ? <span className="badge is-sold">Sold out</span> : saleTag(item) ? <span className="badge is-sale">{saleTag(item)}</span> : item.badge && <span className="badge">{item.badge}</span>}
      {photos.length === 0 && <ProductArt item={item} alt={item.name} sizes={PHOTO_SIZES} />}
      {photos.map((url, position) => <div key={`${position}:${url}`} className={`detail-slide ${position === current ? "is-active" : ""}`} aria-hidden={position === current ? undefined : true}>
        <Image className="art art-photo" src={url} alt={position === current ? (many ? `${item.name}, photo ${position + 1} of ${photos.length}` : item.name) : ""} width={1200} height={1200} sizes={PHOTO_SIZES} loading={position === 0 ? "eager" : "lazy"} fetchPriority={position === 0 ? "high" : "auto"} draggable={false} />
      </div>)}
      {many && <>
        <button type="button" className="detail-nav is-prev" onClick={() => show(current - 1)} aria-label="Previous photo"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5 4 6l3.5 3.5" /></svg></button>
        <button type="button" className="detail-nav is-next" onClick={() => show(current + 1)} aria-label="Next photo"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5" /></svg></button>
        <span className="detail-count" aria-hidden="true">{current + 1} / {photos.length}</span>
      </>}
    </div>
    {many && <ul className="detail-thumbs" aria-label="Choose a photo">
      {photos.map((url, position) => <li key={`${position}:${url}`}>
        <button type="button" onClick={() => setIndex(position)} aria-label={`Show photo ${position + 1}`} aria-current={position === current ? "true" : undefined}>
          <Image className="art art-photo" src={url} alt="" width={96} height={96} sizes="72px" draggable={false} />
        </button>
      </li>)}
    </ul>}
  </div>;
}
