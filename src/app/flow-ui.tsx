import type { ReactNode } from "react";
import { ProductArt } from "./art";
import { FREE_DELIVERY_FROM } from "./orders";
import { money, type Product } from "./products";

type ArtItem = Pick<Product, "name" | "category" | "type" | "color" | "image_url">;

// Where the customer is in the buying flow: cart, then their details, then the confirmation.
export function FlowSteps({ current }: { current: 1 | 2 | 3 }) {
  return <ol className="flow-steps" aria-label="Order steps">
    {["Cart", "Your details", "Done"].map((label, index) => {
      const step = index + 1;
      return <li key={label} className={step === current ? "is-current" : step < current ? "is-done" : ""} aria-current={step === current ? "step" : undefined}>
        <b aria-hidden="true">{step < current ? "✓" : step}</b>{label}
      </li>;
    })}
  </ol>;
}

// Says out loud that orders are not real yet. Remove it once the back end takes orders.
export function DemoNote({ children }: { children: ReactNode }) {
  return <p className="flow-demo"><b>Demo</b><span>{children}</span></p>;
}

export function SummaryLine({ art, name, variety, quantity, total }: { art: ArtItem; name: string; variety: string | null; quantity: number; total: number }) {
  return <li className="summary-line">
    <div className="summary-thumb"><ProductArt item={art} sizes="52px" /><b>{quantity}</b></div>
    <div><strong>{name}</strong>{variety && <span>{variety}</span>}</div>
    <span>{money(total)}</span>
  </li>;
}

export function FreeDeliveryBar({ subtotal }: { subtotal: number }) {
  const left = FREE_DELIVERY_FROM - subtotal;
  return <div className="delivery-bar">
    <p>{left <= 0 ? "You've got free delivery." : <>Add <b>{money(left)}</b> more for free delivery.</>}</p>
    <div className="delivery-track" role="progressbar" aria-label="Progress to free delivery" aria-valuemin={0} aria-valuemax={FREE_DELIVERY_FROM} aria-valuenow={Math.min(subtotal, FREE_DELIVERY_FROM)}>
      <i style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_FROM) * 100)}%` }} />
    </div>
  </div>;
}

// Shown while a page of the buying flow waits for the browser to load the saved cart or order.
export function FlowSkeleton() {
  return <section className="shell flow" aria-busy="true" aria-label="Loading">
    <div className="flow-head"><div className="skeleton skeleton-title" /></div>
    <div className="skeleton skeleton-panel" />
  </section>;
}
