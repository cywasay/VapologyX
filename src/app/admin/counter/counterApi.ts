import { createClient } from "@/utils/supabase/client";
import type { Bottle, CashOut, CounterItem, Pay, Sale } from "./types";

// Everything the counter screen needs when it opens.
export type CounterState = {
  day: string;
  opening: number;
  closed: boolean;
  closing: { counted: number; expected: number; difference: number } | null;
  items: CounterItem[];
  sales: Sale[];
  bottles: Bottle[];
  refillsToday: number;
  refillsAll: number;
  cashOuts: CashOut[];
};

export type Closing = { counted: number; expected: number; difference: number };
export type Reply<T> = { ok: true; data: T } | { ok: false; error: string };

// The database refuses bad requests with short codes. These are the words staff see instead.
function friendly(message: string) {
  const [code, detail = ""] = message.split(": ");
  switch (code) {
    case "day_closed": return "The day is closed. Nothing can change until tomorrow.";
    case "out_of_stock": return `${detail || "That item"} doesn't have enough left in stock.`;
    case "unavailable": return "That item can't be sold from here.";
    case "no_cost": return `${detail || "That bottle"} has no cost set yet. Add its cost first, then open it.`;
    case "old_sale": return "Only today's sales can be voided.";
    case "already_voided": return "That sale is already voided.";
    case "old_entry": return "That refill was made on an earlier day, so it can't be taken back.";
    case "not_found": return "That record is gone. Reload the page and try again.";
    case "invalid_sale": return detail === "given" ? "The cash given is less than the total." : "That sale couldn't be saved.";
    default: return "Something went wrong. Please try again.";
  }
}

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<Reply<T>> {
  const { data, error } = await createClient().rpc(fn, args);
  return error ? { ok: false, error: friendly(error.message) } : { ok: true, data: data as T };
}

export const counterApi = {
  state: () => call<CounterState>("counter_state"),
  sell: (pay: Pay, given: number | null, lines: { productId: string; quantity: number }[]) => call<Sale>("counter_sell", { draft: { pay, given, lines } }),
  voidSale: (id: string) => call<Sale>("counter_void", { p_sale: id, p_reason: "" }),
  openBottle: (productId: string) => call<Bottle>("counter_open_bottle", { p_product: productId }),
  addRefill: (bottleId: string, amount: number) => call<Bottle>("counter_add_refill", { p_bottle: bottleId, p_amount: amount }),
  undoRefill: (bottleId: string) => call<Bottle>("counter_undo_refill", { p_bottle: bottleId }),
  finishBottle: (bottleId: string) => call<Bottle>("counter_finish_bottle", { p_bottle: bottleId }),
  setOpening: (amount: number) => call<number>("counter_set_opening", { p_amount: amount }),
  addCashOut: (amount: number, note: string) => call<CashOut>("counter_add_cash_out", { p_amount: amount, p_note: note }),
  removeCashOut: (id: string) => call<null>("counter_remove_cash_out", { p_id: id }),
  closeDay: (counted: number) => call<Closing>("counter_close_day", { p_counted: counted }),
};
