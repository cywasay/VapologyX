export type Shelf = "device" | "disposable" | "bottle" | "coil";
export type Pay = "Cash" | "Card" | "Wallet";
export type Mode = "sell" | "refill" | "restock";

export type CounterItem = { id: string; name: string; shelf: Shelf; type: string; price: number; stock: number };

// A bottle opened to refill customers' empty bottles. It stays open until staff finish it, however many days that takes.
export type Bottle = { id: string; flavor: string; openedOn: string; cost: number; entries: number[]; finished: boolean };
