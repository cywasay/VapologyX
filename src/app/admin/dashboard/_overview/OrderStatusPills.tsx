"use client";

import { useRouter } from "next/navigation";
import { Pills } from "../../_shared/Pills";
import { useOrderStats } from "../_data/useOrderStats";
import { DASHBOARD } from "../_shell/navItems";
import { orderOptions } from "../orders/orderStatuses";

// Shortcuts to the orders page, one per status, with how many orders are in it.
export function OrderStatusPills() {
  const router = useRouter();
  const { count } = useOrderStats();
  return <Pills label="Order status" options={orderOptions} value="" onChange={status => router.push(`${DASHBOARD}/orders${status === "all" ? "" : `?status=${status}`}`)} count={option => count(option)} />;
}
