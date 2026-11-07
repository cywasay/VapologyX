import { getLinkedCoils, getProducts, getProductsByIds } from "@/lib/product-data";
import type { Product } from "@/lib/products";
import { CoilFinder } from "./CoilFinder";

// How many devices the home page offers. The full list is one tap away on the coils page.
const FINDER_DEVICES = 5;

const brandOf = (name: string) => name.split(/[\s-]+/)[0].toLowerCase();

// Which devices to offer: only ones that have coils, in stock before sold out, and one from each brand before a second from any.
export function chooseDevices(withCoils: Product[], limit = FINDER_DEVICES) {
  const ordered = [...withCoils.filter(item => item.stock !== 0), ...withCoils.filter(item => item.stock === 0)];
  const brands = new Set<string>();
  const firstOfBrand: Product[] = [];
  const others: Product[] = [];
  for (const item of ordered) {
    const brand = brandOf(item.name);
    if (brands.has(brand)) others.push(item);
    else {
      brands.add(brand);
      firstOfBrand.push(item);
    }
  }
  return [...firstOfBrand, ...others].slice(0, limit);
}

// Only devices that have at least one coil made for them are ever shown. With none, the section is left out.
export async function CoilFinderSection() {
  const [coils, deviceShelf] = await Promise.all([getLinkedCoils(), getProducts("device", 1)]);
  const ids = [...new Set(coils.flatMap(coil => coil.fits))];
  const found = ids.length > 0 ? (await getProductsByIds(ids)).filter(item => item.category === "device") : [];
  const devices = chooseDevices(found);
  if (devices.length === 0) return null;
  const fitting = Object.fromEntries(devices.map(device => [device.id, coils.filter(coil => coil.fits.includes(device.id))]));
  return <section id="coil-finder" className="shell section" aria-labelledby="finder-title">
    <CoilFinder devices={devices} coils={fitting} totalDevices={deviceShelf.total} />
  </section>;
}
