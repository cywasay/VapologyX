import { money } from "@/lib/products";
import { Icon } from "../../_shared/Icon";
import { StatusTag } from "./StatusTag";
import type { AdminOrder } from "./useOrderList";

export const formatDate = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

function OrderRow({ order, onOpen }: { order: AdminOrder; onOpen: (order: AdminOrder) => void }) {
  const items = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  return <tr>
    <td data-label="Order"><strong>{order.number}</strong></td>
    <td data-label="Customer"><div className="admin-order-customer"><span>{order.customer_name}</span><small>{order.customer_phone}</small></div></td>
    <td data-label="Items">{items}</td>
    <td data-label="Total">{money(order.total)}</td>
    <td data-label="Status"><StatusTag status={order.status} /></td>
    <td data-label="Placed">{formatDate(order.created_at)}</td>
    <td data-wide><div className="admin-row-actions"><button className="admin-row-link" onClick={() => onOpen(order)} aria-label={`Open order ${order.number}`} title="Open"><Icon name="arrow" /></button></div></td>
  </tr>;
}

export function OrdersTable({ items, onOpen }: { items: AdminOrder[]; onOpen: (order: AdminOrder) => void }) {
  return <div className="admin-table is-cards">
    <table>
      <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Placed</th><th><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{items.map(order => <OrderRow key={order.id} order={order} onOpen={onOpen} />)}</tbody>
    </table>
  </div>;
}
