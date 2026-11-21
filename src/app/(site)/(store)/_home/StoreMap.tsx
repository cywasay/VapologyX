import { STORE } from "@/lib/store-info";

// The real Google map, centred on the shop, recoloured in the shop's black and lime (see .home-map in globals.css),
// with our own pin on the exact spot. The map can't be dragged, so the pin always stays on the shop:
// one tap opens it in Google Maps, and phones never get stuck scrolling inside it.
// It loads only when scrolled near, so the home page stays fast.
export function StoreMap() {
  return <a className="home-map" href={STORE.mapLink} target="_blank" rel="noopener noreferrer" aria-label="Open VapologyX in Google Maps">
    <iframe src={STORE.mapEmbed} title="Map of VapologyX" loading="lazy" referrerPolicy="no-referrer-when-downgrade" tabIndex={-1} aria-hidden="true" />
    <svg className="home-map-pin" viewBox="-14 -37 28 38" aria-hidden="true">
      <path d="M0 0C-4-7-12-13-12-22a12 12 0 1 1 24 0C12-13 4-7 0 0Z" />
      <circle cy="-22" r="4.6" />
    </svg>
    <span className="home-map-open">Open in Google Maps <i aria-hidden="true">↗</i></span>
  </a>;
}
