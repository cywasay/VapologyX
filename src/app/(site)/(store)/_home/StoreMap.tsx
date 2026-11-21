import { STORE } from "@/lib/store-info";

// The real Google map, centred on the shop with Google's own pin. The map itself can't be dragged:
// one tap opens the shop in Google Maps, so phones never get stuck scrolling inside it.
// It loads only when scrolled near, so the home page stays fast.
export function StoreMap() {
  return <a className="home-map" href={STORE.mapLink} target="_blank" rel="noopener noreferrer" aria-label="Open VapologyX in Google Maps">
    <iframe src={STORE.mapEmbed} title="Map of VapologyX" loading="lazy" referrerPolicy="no-referrer-when-downgrade" tabIndex={-1} aria-hidden="true" />
    <span className="home-map-open">Open in Google Maps <i aria-hidden="true">↗</i></span>
  </a>;
}
