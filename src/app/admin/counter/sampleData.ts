import type { Bottle, CounterItem } from "./types";

// Sample data for the counter mock. The real version reads the shop's stock.
export const SAMPLE_ITEMS: CounterItem[] = [
  { id: "b1", name: "Mango Ice 60ml", shelf: "bottle", type: "Fruit", price: 1000, stock: 6 },
  { id: "b2", name: "Blue Razz 60ml", shelf: "bottle", type: "Fruit", price: 1000, stock: 4 },
  { id: "b3", name: "Cool Mint 60ml", shelf: "bottle", type: "Menthol", price: 1000, stock: 5 },
  { id: "b4", name: "Tobacco Gold 60ml", shelf: "bottle", type: "Tobacco", price: 1000, stock: 0 },
  { id: "d1", name: "Device 01", shelf: "device", type: "Pod", price: 5000, stock: 3 },
  { id: "d2", name: "Device 02", shelf: "device", type: "Box", price: 10000, stock: 2 },
  { id: "d3", name: "Device 03", shelf: "device", type: "Pen", price: 5000, stock: 4 },
  { id: "s1", name: "Disposable 01", shelf: "disposable", type: "Disposable", price: 1500, stock: 8 },
  { id: "s2", name: "Disposable 02", shelf: "disposable", type: "Disposable", price: 1500, stock: 5 },
  { id: "s3", name: "Disposable 03", shelf: "disposable", type: "Disposable", price: 1500, stock: 1 },
  { id: "c1", name: "Coil 01", shelf: "coil", type: "Coil", price: 2000, stock: 6 },
  { id: "c2", name: "Coil 02", shelf: "coil", type: "Coil", price: 2000, stock: 4 },
  { id: "c3", name: "Coil 03", shelf: "coil", type: "Coil", price: 2000, stock: 2 },
  { id: "c4", name: "Coil 04", shelf: "coil", type: "Coil", price: 2000, stock: 0 },
];

export const SAMPLE_BOTTLES: Bottle[] = [
  { id: "r1", flavor: "Mango Ice", openedOn: "3 Nov", cost: 1000, entries: [300, 500, 200, 400, 200], finished: false },
  { id: "r2", flavor: "Blue Razz", openedOn: "5 Nov", cost: 1000, entries: [200, 200], finished: false },
  { id: "r3", flavor: "Cool Mint", openedOn: "28 Oct", cost: 1000, entries: [500, 400, 600, 300], finished: true },
];
