// Turns the owner's inventory spreadsheet into rows we can import. Pure and free of the browser, so it is easy to test.
// The sheet holds four stacked lists (Coils, Bottles, Devices, Disposables). Each starts with a header row that has
// "S.No" in the first column and the list's name in the second, and ends at a row that starts with "Total".
import type { Category } from "@/lib/products";

export type ImportRow = {
  category: Category;
  name: string;
  qty: number;
  cost: number;
  price: number;
  // The row's number in the sheet, so a problem can be pointed at.
  line: number;
};
export type ImportIssue = { line: number; message: string };
export type InventoryReading = { rows: ImportRow[]; problems: ImportIssue[]; notes: ImportIssue[] };

type Cell = string | number | boolean | Date | null | undefined;

const SECTIONS: { match: RegExp; category: Category }[] = [
  { match: /^coils?$/, category: "coil" },
  { match: /^bottles?$/, category: "bottle" },
  { match: /^devices?$/, category: "device" },
  { match: /^dispos[ai]bles?$/, category: "disposable" },
];

const text = (cell: Cell) => typeof cell === "string" ? cell.replace(/\s+/g, " ").trim() : typeof cell === "number" ? String(cell) : "";
const words = (cell: Cell) => text(cell).toLowerCase();
const isNumber = (cell: Cell): cell is number => typeof cell === "number" && Number.isFinite(cell);

type Columns = { name: number; qty: number; rate: number; present: number; sold: number; price: number };

// Columns are found by their header names, so a column moved in a future sheet still works.
function columnsOf(header: Cell[]): Columns | null {
  const find = (...names: string[]) => header.findIndex(cell => names.includes(words(cell)));
  const columns = { name: 1, qty: find("qty"), rate: find("rate"), present: find("present"), sold: find("sold"), price: find("price") };
  return columns.qty < 0 || columns.rate < 0 || columns.price < 0 ? null : columns;
}

export function readInventory(sheet: Cell[][]): InventoryReading {
  const rows: ImportRow[] = [];
  const problems: ImportIssue[] = [];
  const notes: ImportIssue[] = [];
  const seen = new Set<string>();
  let category: Category | null = null;
  let columns: Columns | null = null;

  sheet.forEach((row, index) => {
    const line = index + 1;
    const section = words(row[0]) === "s.no" ? SECTIONS.find(item => item.match.test(words(row[1]))) : undefined;
    if (section) {
      category = section.category;
      columns = columnsOf(row);
      if (!columns) problems.push({ line, message: `The "${text(row[1])}" list is missing its Qty, Rate or Price column.` });
      return;
    }
    if (words(row[0]) === "s.no") { category = null; return; }
    if (!category || !columns) return;
    if (words(row[0]).startsWith("total")) { category = null; return; }

    const name = text(row[columns.name]);
    if (!name) return;
    const qty = row[columns.qty];
    const rate = row[columns.rate];
    const price = row[columns.price];
    const sold = columns.sold >= 0 ? row[columns.sold] : 0;
    const present = columns.present >= 0 ? row[columns.present] : undefined;
    // "Present" is what is on the shelf now. If it is blank, work it out from Qty and Sold.
    const stock = isNumber(present) ? present : isNumber(qty) ? qty - (isNumber(sold) ? sold : 0) : NaN;

    if (!Number.isInteger(stock) || stock < 0) return void problems.push({ line, message: `${name}: the quantity isn't a whole number of zero or more.` });
    if (!isNumber(rate) || rate < 0) return void problems.push({ line, message: `${name}: the rate (cost) is missing or not a number.` });
    if (!isNumber(price) || price < 0) return void problems.push({ line, message: `${name}: the price is missing or not a number.` });
    if (!Number.isInteger(price)) return void problems.push({ line, message: `${name}: the price ${price} isn't a whole number of rupees.` });

    const key = `${category}|${name.toLowerCase()}`;
    if (seen.has(key)) return void problems.push({ line, message: `${name} is listed twice. Only the first one is used.` });
    seen.add(key);

    if (rate === 0) notes.push({ line, message: `${name}: the rate (cost) is 0, so its profit will show as the full price.` });
    rows.push({ category, name, qty: stock, cost: rate, price, line });
  });

  return { rows, problems, notes };
}
