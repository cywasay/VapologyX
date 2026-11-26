import type { LoyaltyChannel } from "@/lib/loyalty";
import { createClient } from "@/utils/supabase/client";

export type MemberRow = { id: string; phone: string; name: string; balance: number; expiring: number; earned: number; used: number; last: string };
export type MemberList = { total: number; pointsOut: number; items: MemberRow[] };
export type Entry = { id: string; channel: LoyaltyChannel; kind: "earn" | "redeem" | "adjust" | "reverse"; points: number; remaining: number; note: string; date: string; expires: string | null; expired: boolean };
export type MemberDetail = {
  id: string; phone: string; name: string;
  shop: { member: boolean; balance: number }; online: { member: boolean; balance: number };
  entries: Entry[];
};
export type Reply<T> = { ok: true; data: T } | { ok: false; error: string };

function friendly(message: string) {
  if (message.includes("reason_needed")) return "Please write a reason for this change.";
  if (message.includes("points_balance")) return "The customer doesn't have that many points to take away.";
  if (message.includes("invalid_points")) return "Type a whole number of points, like 500 or -200.";
  return "Something went wrong. Please try again.";
}

async function call<T>(fn: string, args: Record<string, unknown>): Promise<Reply<T>> {
  const { data, error } = await createClient().rpc(fn, args);
  return error ? { ok: false, error: friendly(error.message) } : { ok: true, data: data as T };
}

export const loyaltyApi = {
  list: (channel: LoyaltyChannel, search: string, offset: number, limit: number) => call<MemberList>("loyalty_list", { p_channel: channel, p_search: search, p_offset: offset, p_limit: limit }),
  member: (id: string) => call<MemberDetail>("loyalty_customer", { p_customer: id }),
  adjust: (id: string, channel: LoyaltyChannel, points: number, reason: string) => call<MemberDetail>("loyalty_adjust", { p_customer: id, p_channel: channel, p_points: points, p_reason: reason }),
  rename: (id: string, name: string) => call<null>("loyalty_rename", { p_customer: id, p_name: name }),
};
