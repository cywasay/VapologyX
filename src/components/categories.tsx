import type { ReactNode } from "react";
import { BottleArt, CoilArt, DeviceArt, DisposableArt } from "@/components/art";
import { GRAPHITE, LIME, type Category } from "@/lib/products";

// The four shelves, with their drawing and colors. Used by menus, the home page and search.
export const categories: { category: Category; href: string; name: string; blurb: string; tone: string; art: ReactNode }[] = [
  { category: "device", href: "/devices", name: "Devices", blurb: "Pods, boxes and pens for every style.", tone: "tone-light", art: <DeviceArt kind="box" color={LIME} /> },
  { category: "disposable", href: "/disposables", name: "Disposables", blurb: "Ready to go, with nothing to set up.", tone: "tone-gray", art: <DisposableArt color={GRAPHITE} /> },
  { category: "bottle", href: "/bottles", name: "Bottles", blurb: "Flavors sorted by taste, from fruit to menthol.", tone: "tone-lime", art: <BottleArt color={GRAPHITE} /> },
  { category: "coil", href: "/coils", name: "Coils", blurb: "Matched to the device you already own.", tone: "tone-dark", art: <CoilArt color={LIME} /> },
];
