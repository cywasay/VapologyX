"use client";

import { useRouter } from "next/navigation";
import { Pills } from "../../_shared/Pills";
import { DASHBOARD } from "../_shell/navItems";
import { orderOptions } from "../orders/orderStatuses";

// Shortcuts to the orders page, one per status.
export function OrderStatusPills() {
  const router = useRouter();
  return <Pills label="Order status" options={orderOptions} value="" onChange={status => router.push(`${DASHBOARD}/orders?status=${encodeURIComponent(status)}`)} count={() => 0} />;
}
