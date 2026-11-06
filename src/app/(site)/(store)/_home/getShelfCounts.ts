import { getProducts } from "@/lib/product-data";
import type { ShelfCounts } from "./HeroStage";

// How many products each shelf holds. The reads are cached, so every section can ask for this.
export async function getShelfCounts(): Promise<ShelfCounts> {
  const [device, disposable, bottle, coil] = await Promise.all([getProducts("device", 8), getProducts("disposable", 1), getProducts("bottle", 4), getProducts("coil", 1)]);
  return { device: device.total, disposable: disposable.total, bottle: bottle.total, coil: coil.total };
}
