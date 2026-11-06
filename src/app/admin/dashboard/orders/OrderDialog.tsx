"use client";

import { useEffect, useRef, useState } from "react";
import { Select } from "@/components/dropdown";
import { paymentLabel, type OrderStatus } from "@/lib/orders";
import { money } from "@/lib/products";
import { createClient } from "@/utils/supabase/client";
import { STATUSES, statusName } from "./orderStatuses";
import { formatDate } from "./OrdersTable";
import type { AdminOrder } from "./useOrderList";

// One order opened from the list: what was bought, who it is for, and a way to move it along.
export function OrderDialog({ order, onClose, onChanged }: { order: AdminOrder; onClose: () => void; onChanged: (message: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { dialog.current?.showModal(); }, []);

  async function save() {
    setBusy(true);
    setError("");
    const { data, error: updateError } = await createClient().from("orders").update({ status }).eq("id", order.id).select("id");
    if (updateError || !data?.length) {
      setError("The status couldn't be changed. Please try again.");
      setBusy(false);
      return;
    }
    onChanged(`Order ${order.number} is now ${statusName[status].toLowerCase()}.`);
  }

  const pickup = order.delivery_method === "pickup";
  return <dialog ref={dialog} className="product-form" aria-labelledby="order-dialog-title" onClose={event => { if (event.target === event.currentTarget) onClose(); }} onCancel={event => { if (busy) event.preventDefault(); }}>
    <div className="product-form-top">
      <h2 id="order-dialog-title">Order {order.number}</h2>
      <button type="button" className="cart-close" aria-label="Close" disabled={busy} onClick={() => dialog.current?.close()}>×</button>
    </div>

    <div className="product-form-body">
      <section className="product-form-group">
        <h3 className="admin-subtitle">Status</h3>
        <Select value={status} options={STATUSES.map(item => ({ value: item, label: statusName[item] }))} onChange={next => setStatus(next as OrderStatus)} aria-label="Order status" />
        {status === "cancelled" && order.status !== "cancelled" && <p>Cancelling puts the items back in stock.</p>}
      </section>

      <section className="product-form-group">
        <h3 className="admin-subtitle">Items</h3>
        <ul className="order-lines">
          {order.lines.map((line, index) => <li key={`${line.productId}-${line.variety ?? ""}-${index}`}>
            <span>{line.quantity} × {line.name}{line.variety && <small> ({line.variety})</small>}</span>
            <b>{money(line.unitPrice * line.quantity)}</b>
          </li>)}
        </ul>
        <dl className="order-totals">
          <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
          <div><dt>{pickup ? "Pickup" : "Delivery"}</dt><dd>{order.delivery_fee === 0 ? "Free" : money(order.delivery_fee)}</dd></div>
          <div><dt>Total</dt><dd>{money(order.total)}</dd></div>
        </dl>
      </section>

      <section className="product-form-group">
        <h3 className="admin-subtitle">Customer</h3>
        <dl className="detail-list">
          <div><dt>Name</dt><dd>{order.customer_name}</dd></div>
          <div><dt>Mobile</dt><dd>{order.customer_phone}</dd></div>
          {order.customer_email && <div><dt>Email</dt><dd>{order.customer_email}</dd></div>}
          {pickup ? <div><dt>Collect from</dt><dd>The store</dd></div> : <div><dt>Deliver to</dt><dd>{order.address}, {order.city}</dd></div>}
          <div><dt>Payment</dt><dd>{paymentLabel(order.payment)}</dd></div>
          {order.notes && <div><dt>Note</dt><dd>{order.notes}</dd></div>}
          <div><dt>Placed</dt><dd>{formatDate(order.created_at)}</dd></div>
        </dl>
      </section>
    </div>

    <div className="product-form-foot">
      <p className="form-status is-error" role="alert">{error}</p>
      <div>
        <button type="button" className="button button-outline" disabled={busy} onClick={() => dialog.current?.close()}>Close</button>
        <button type="button" className="button button-primary" disabled={busy || status === order.status} onClick={save}>{busy ? "Saving…" : "Save status"}</button>
      </div>
    </div>
  </dialog>;
}
