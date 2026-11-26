export type Shelf = "device" | "disposable" | "bottle" | "coil";
export type Pay = "Cash" | "Bank" | "Wallet";
export type Mode = "sell" | "refill" | "sales" | "closing" | "restock";

// code is the barcode printed on the item. A scanner types it into the search box and presses Enter.
export type CounterItem = { id: string; code: string; name: string; shelf: Shelf; type: string; price: number; wasPrice: number | null; stock: number };

// A bottle opened to refill customers' empty bottles. It stays open until staff finish it, however many days that takes.
export type Bottle = { id: string; flavor: string; openedOn: string; cost: number | null; entries: number[]; finished: boolean };

export type SaleLine = { itemId: string; name: string; price: number; quantity: number };
export type Sale = {
  id: string; number: number; time: string; date?: string; lines: SaleLine[]; listTotal: number; total: number; pay: Pay; given: number | null; voided: boolean;
  // Loyalty Club: points used on this bill, points it earned, the customer, and their shop balance right after the sale.
  pointsUsed?: number; pointsEarned?: number; customer?: { phone: string; name: string } | null; pointsBalance?: number;
};

// A Loyalty Club member found by mobile number while ringing up a sale.
export type Member = { phone: string; found: boolean; name: string; shop: number; online: number };

export type CashOut = { id: string; amount: number; note: string };

// The kinds are the labels from the owner's closing sheet. The database accepts exactly these.
export const EXPENSE_KINDS = ["Food", "Tea", "PTCL", "Tissue", "Freshner", "Key", "Exp", "Ship", "Shipping", "CMC Tax", "Elite Tax"] as const;
export type ExpenseKind = (typeof EXPENSE_KINDS)[number];
// fromDrawer: paid with cash from the till, so it lowers the cash the drawer should hold.
export type Expense = { id: string; kind: ExpenseKind; amount: number; note: string; fromDrawer: boolean };
