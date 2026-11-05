import Image from "next/image";
import type { Product } from "./products";

export function Wordmark() {
  return <span className="wordmark">Vapology<i>X</i></span>;
}

// Shared gradients for the product drawings. Render once on any page that uses them.
export function ArtDefs() {
  const stops = (colors: [number, string][]) => colors.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />);
  return <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true"><defs>
    <linearGradient id="art-metal">{stops([[0, "#232325"], [.16, "#5a5a5f"], [.42, "#39393c"], [1, "#19191b"]])}</linearGradient>
    <linearGradient id="art-glass">{stops([[0, "#141415"], [.2, "#3e3e41"], [.55, "#1f1f21"], [1, "#0e0e0f"]])}</linearGradient>
    <linearGradient id="art-steel">{stops([[0, "#6e6e72"], [.28, "#dcdcde"], [.68, "#808084"], [1, "#454548"]])}</linearGradient>
  </defs></svg>;
}

// Drawn placeholders, used until the client supplies product photography.
export function DeviceArt({ kind, color }: { kind: "pod" | "box" | "pen"; color: string }) {
  return <svg className="art" viewBox="0 0 200 260" aria-hidden="true">
    {kind === "pod" && <>
      <path d="M80 56 85 20q1-6 6-6h18q5 0 6 6l5 36Z" fill="url(#art-glass)" />
      <rect x="68" y="54" width="64" height="192" rx="18" fill="url(#art-metal)" />
      <rect x="86" y="72" width="28" height="50" rx="5" fill={color} opacity=".9" />
      <rect x="92" y="204" width="16" height="3" rx="1.5" fill={color} />
    </>}
    {kind === "box" && <>
      <rect x="84" y="10" width="32" height="14" rx="3" fill="url(#art-steel)" />
      <rect x="76" y="22" width="48" height="54" rx="4" fill="url(#art-glass)" />
      <rect x="40" y="74" width="120" height="172" rx="14" fill="url(#art-metal)" />
      <rect x="56" y="92" width="88" height="56" rx="3" fill="#0a0a0b" />
      <rect x="66" y="104" width="40" height="7" fill={color} />
      <rect x="66" y="118" width="66" height="3" fill="#77777b" />
      <rect x="66" y="127" width="44" height="3" fill="#77777b" />
      <rect x="82" y="162" width="36" height="8" rx="4" fill="#111112" />
      <circle cx="100" cy="206" r="17" fill="#111112" />
      <circle cx="100" cy="206" r="12" fill="url(#art-steel)" />
    </>}
    {kind === "pen" && <>
      <rect x="88" y="14" width="24" height="50" rx="6" fill="url(#art-glass)" />
      <rect x="80" y="60" width="40" height="186" rx="9" fill="url(#art-metal)" />
      <rect x="91" y="74" width="18" height="58" rx="4" fill={color} opacity=".9" />
      <circle cx="100" cy="166" r="7" fill="url(#art-steel)" />
      <rect x="80" y="222" width="40" height="2" fill={color} />
    </>}
  </svg>;
}

export function DisposableArt({ color }: { color: string }) {
  return <svg className="art" viewBox="0 0 200 260" aria-hidden="true">
    <path d="M82 52 86 20q1-6 6-6h16q5 0 6 6l4 32Z" fill="url(#art-glass)" />
    <rect x="64" y="50" width="72" height="196" rx="16" fill="url(#art-metal)" />
    <rect x="64" y="96" width="72" height="84" fill={color} />
    <rect x="76" y="112" width="40" height="6" fill="#121213" />
    <rect x="76" y="126" width="26" height="3" fill="#121213" opacity=".6" />
    <circle cx="100" cy="212" r="5" fill="url(#art-steel)" />
  </svg>;
}

export function BottleArt({ color }: { color: string }) {
  return <svg className="art" viewBox="0 0 200 260" aria-hidden="true">
    <rect x="80" y="12" width="40" height="50" rx="5" fill="url(#art-glass)" />
    <rect x="88" y="60" width="24" height="16" fill="#2a2a2c" />
    <path d="M60 106q0-32 32-32h16q32 0 32 32v124q0 16-16 16H76q-16 0-16-16Z" fill="url(#art-glass)" />
    <rect x="60" y="126" width="80" height="92" fill={color} />
    <rect x="72" y="142" width="48" height="6" fill="#121213" />
    <rect x="72" y="156" width="30" height="3" fill="#121213" opacity=".6" />
    <rect x="72" y="196" width="18" height="10" fill="#121213" />
  </svg>;
}

type ArtProduct = Pick<Product, "name" | "category" | "type" | "color" | "image_url">;

// Shows the real photo when there is one, and a drawing until then.
export function ProductArt({ item, sizes = "(max-width: 768px) 50vw, 25vw", alt = "" }: { item: ArtProduct; sizes?: string; alt?: string }) {
  if (item.image_url) return <Image className="art art-photo" src={item.image_url} alt={alt} width={800} height={800} sizes={sizes} />;
  if (item.category === "device") {
    const kind = item.type.toLowerCase();
    return <DeviceArt kind={kind === "box" || kind === "pen" ? kind : "pod"} color={item.color} />;
  }
  if (item.category === "coil") return <CoilArt color={item.color} />;
  if (item.category === "bottle") return <BottleArt color={item.color} />;
  return <DisposableArt color={item.color} />;
}

export function CoilArt({ color }: { color: string }) {
  return <svg className="art" viewBox="0 0 200 260" aria-hidden="true">
    <rect x="66" y="34" width="68" height="190" rx="6" fill="url(#art-steel)" />
    <rect x="62" y="56" width="76" height="9" rx="3" fill="#141415" />
    <rect x="62" y="194" width="76" height="9" rx="3" fill="#141415" />
    <rect x="86" y="86" width="28" height="86" rx="14" fill="#141415" />
    <path d="M90 100h20M90 112h20M90 124h20M90 136h20M90 148h20M90 160h20" stroke={color} strokeWidth="4" />
  </svg>;
}
