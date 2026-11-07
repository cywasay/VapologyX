import type { CSSProperties } from "react";
import { ORDER_STEPS, statusLabel, statusNote, type Order } from "@/lib/orders";

// How far along the order is. A cancelled order skips the steps and says so plainly.
export function StatusTimeline({ order }: { order: Order }) {
  const method = order.delivery.method;
  if (order.status === "cancelled") {
    return <div className="timeline-cancelled" role="status"><strong>{statusLabel("cancelled", method)}</strong><p>{statusNote("cancelled", method)}</p></div>;
  }
  const current = ORDER_STEPS.indexOf(order.status);
  const finished = order.status === "delivered";
  return <div className="panel-light checkout-card">
    <p className="timeline-note" role="status">{statusNote(order.status, method)}</p>
    <ol className="timeline keep-motion" aria-label="Order progress">
      {ORDER_STEPS.map((step, index) => {
        const done = index < current || (finished && index === current);
        return <li key={step} style={{ "--n": index } as CSSProperties} className={done ? "is-done" : index === current ? "is-current" : ""} aria-current={index === current ? "step" : undefined}>
          <span className="timeline-dot" aria-hidden="true">{done ? "✓" : index + 1}</span>
          <span>{statusLabel(step, method)}</span>
        </li>;
      })}
    </ol>
  </div>;
}
