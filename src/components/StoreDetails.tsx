import { STORE } from "@/lib/store-info";

export function StoreDetails() {
  return <dl className="store-details">
    <div><dt>Address</dt><dd>{STORE.address}<br /><a href={STORE.mapLink} target="_blank" rel="noopener noreferrer">Open in Google Maps</a></dd></div>
    <div><dt>Hours</dt><dd>{STORE.hours}<br /><small>{STORE.hoursNote}</small></dd></div>
    <div><dt>Contact</dt><dd><a href={STORE.phoneLink}>{STORE.phone}</a> · <a href={STORE.whatsappLink} target="_blank" rel="noopener noreferrer">WhatsApp</a></dd></div>
  </dl>;
}
