import { createClient } from "@/utils/supabase/client";

// The month's figures, laid out like the owner's Excel "Daily CLosing" sheet. Worked out in the database (month_figures).
export type Section = { sales: number; cost: number; profit: number };
export type MonthInputs = {
  oldAmount: number | null; personalInvestment: number; investmentReturn: number; withdrawalProfit: number;
  cash: number; bank: number; rentPaid: number; electricPaid: number; matchAmount: number | null;
};
export type MonthReport = {
  month: string;
  inputs: MonthInputs;
  firstMonth: boolean;
  sections: { hardware: Section; bottles: Section; coils: Section; cashAdjustment: { sales: number; cost: number; refills: number; taxes: number; bottlesOpened: number } };
  salesTotal: number; profit: number; rent: number; electric: number; pay: number; charity: number;
  directExpenses: number; writeOffs: number; shopExpense: number; netProfit: number;
  oldAmount: number; paidRestock: number; restockAmount: number; diff: number;
  stockValue: number; assets: number; matchTotal: number; matchDiff: number | null;
  discounts: { total: number; count: number; lastMonth: number };
  extra: { total: number; count: number; lastMonth: number };
  adjustedSales: { number: number; date: string; listTotal: number; total: number; items: string }[];
  onlineOrders: number;
  closed: boolean; closedOn: string | null; locked: boolean;
};
export type Asset = { id: string; name: string; value: number };
export type Reply<T> = { ok: true; data: T } | { ok: false; error: string };

function friendly(message: string) {
  if (message.includes("month_locked")) return "This month is locked. Nothing can change.";
  if (message.includes("close_first")) return "Close the month first, then lock it.";
  if (message.includes("invalid")) return "Please type whole rupees in every box.";
  return "Something went wrong. Please try again.";
}

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<Reply<T>> {
  const { data, error } = await createClient().rpc(fn, args);
  return error ? { ok: false, error: friendly(error.message) } : { ok: true, data: data as T };
}

export const closingApi = {
  report: (month: string) => call<MonthReport>("month_report", { p_month: month }),
  save: (month: string, inputs: Record<string, string>) => call<MonthReport>("month_save", { p_month: month, p_inputs: inputs }),
  close: (month: string, lock: boolean) => call<MonthReport>("month_close", { p_month: month, p_lock: lock }),
  assets: async (): Promise<Reply<Asset[]>> => {
    const { data, error } = await createClient().from("fixed_assets").select("id,name,value").is("removed_at", null).order("created_at");
    return error ? { ok: false, error: friendly(error.message) } : { ok: true, data: data as Asset[] };
  },
  addAsset: (name: string, value: number) => call<null>("asset_add", { p_name: name, p_value: value }),
  removeAsset: (id: string) => call<null>("asset_remove", { p_id: id }),
};
