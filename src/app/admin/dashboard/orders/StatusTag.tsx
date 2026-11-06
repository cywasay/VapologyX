import type { OrderStatus } from "@/lib/orders";
import { statusName } from "./orderStatuses";

export function StatusTag({ status }: { status: OrderStatus }) {
  return <span className={`status-tag is-${status}`}>{statusName[status]}</span>;
}
