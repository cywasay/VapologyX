import { FREE_DELIVERY_FROM } from "@/lib/orders";
import { money } from "@/lib/products";

export function FreeDeliveryBar({ subtotal }: { subtotal: number }) {
  const left = FREE_DELIVERY_FROM - subtotal;
  return <div className="delivery-bar">
    <p>{left <= 0 ? "You've got free delivery." : <>Add <b>{money(left)}</b> more for free delivery.</>}</p>
    <div className="delivery-track" role="progressbar" aria-label="Progress to free delivery" aria-valuemin={0} aria-valuemax={FREE_DELIVERY_FROM} aria-valuenow={Math.min(subtotal, FREE_DELIVERY_FROM)}>
      <i style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_FROM) * 100)}%` }} />
    </div>
  </div>;
}
