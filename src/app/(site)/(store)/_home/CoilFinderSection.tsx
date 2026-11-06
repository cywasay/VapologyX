import { getCoilsFor, getProducts } from "@/lib/product-data";
import { CoilFinder } from "./CoilFinder";

export async function CoilFinderSection() {
  const devices = await getProducts("device", 8);
  if (devices.items.length === 0) return null;
  const fitting = await Promise.all(devices.items.map(device => getCoilsFor(device.id)));
  const coils = Object.fromEntries(devices.items.map((device, index) => [device.id, fitting[index]]));
  return <section className="shell section" aria-labelledby="finder-title">
    <CoilFinder devices={devices.items} coils={coils} />
  </section>;
}
