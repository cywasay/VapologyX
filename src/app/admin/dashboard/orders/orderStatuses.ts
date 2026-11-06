import type { OrderStatus } from "@/lib/orders";

// The words the admin uses for each status. The shop shows customers friendlier text from lib/orders.
export const statusName: Record<OrderStatus, string> = {
  placed: "New",
  confirmed: "Confirmed",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUSES = Object.keys(statusName) as OrderStatus[];

export const orderOptions = [{ value: "all", label: "All orders" }, ...STATUSES.map(status => ({ value: status, label: statusName[status] }))];
export const orderStatuses = orderOptions.map(option => option.value);
