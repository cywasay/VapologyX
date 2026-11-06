import { paymentLabel, type Order } from "@/lib/orders";

export function OrderDetails({ order }: { order: Order }) {
  const { customer, delivery } = order;
  return <dl className="detail-list">
    <div><dt>Name</dt><dd>{customer.name}</dd></div>
    <div><dt>Mobile</dt><dd>{customer.phone}</dd></div>
    {customer.email && <div><dt>Email</dt><dd>{customer.email}</dd></div>}
    {delivery.method === "delivery"
      ? <div><dt>Deliver to</dt><dd>{delivery.address}, {delivery.city}</dd></div>
      : <div><dt>Collect from</dt><dd>The store</dd></div>}
    <div><dt>Payment</dt><dd>{paymentLabel(order.payment)}</dd></div>
    {delivery.notes && <div><dt>Note</dt><dd>{delivery.notes}</dd></div>}
    <div><dt>Placed</dt><dd>{new Date(order.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</dd></div>
  </dl>;
}
