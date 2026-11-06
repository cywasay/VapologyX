export type Shelf = "device" | "disposable" | "bottle" | "coil";
export type Pay = "Cash" | "Card" | "Wallet";
export type Mode = "sell" | "refill" | "sales" | "closing" | "restock";

// code is the barcode printed on the item. A scanner types it into the search box and presses Enter.
export type CounterItem = { id: string; code: string; name: string; shelf: Shelf; type: string; price: number; stock: number };

// A bottle opened to refill customers' empty bottles. It stays open until staff finish it, however many days that takes.
export type Bottle = { id: string; flavor: string; openedOn: string; cost: number; entries: number[]; finished: boolean };

export type SaleLine = { itemId: string; name: string; price: number; quantity: number };
export type Sale = { id: string; number: number; time: string; lines: SaleLine[]; total: number; pay: Pay; given: number | null; voided: boolean };

export type CashOut = { id: string; amount: number; note: string };
