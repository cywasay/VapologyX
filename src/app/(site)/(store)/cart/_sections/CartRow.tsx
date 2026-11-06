import Link from "next/link";
import { ProductArt } from "@/components/art";
import { lineLimit, lineName, lineUnitPrice, type CartLine } from "@/lib/cart-store";
import { fewLeft, money, productHref } from "@/lib/products";

// One product in the cart, with its quantity buttons and a Remove link.
export function CartRow({ line, lines, onQuantity, onRemove }: { line: CartLine; lines: CartLine[]; onQuantity: (key: string, quantity: number) => void; onRemove: (key: string) => void }) {
  const unit = lineUnitPrice(line);
  const few = fewLeft(line.item);
  const atLimit = line.quantity >= lineLimit(lines, line);
  return <li className="cart-row">
    <Link href={productHref(line.item)} className="cart-row-image" aria-label={`View ${line.item.name}`} tabIndex={-1}><ProductArt item={line.item} sizes="88px" /></Link>
    <div className="cart-row-main">
      <Link href={productHref(line.item)} className="cart-row-name">{line.item.name}</Link>
      {line.variety && <span>{line.variety.name}</span>}
      <span>{money(unit)} each</span>
      {few && <em className="stock-note">Only {few} left</em>}
    </div>
    <div className="stepper">
      <button onClick={() => onQuantity(line.key, line.quantity - 1)} aria-label={`Remove one ${lineName(line)}`}>−</button>
      <b aria-label={`${line.quantity} in your cart`}>{line.quantity}</b>
      <button onClick={() => onQuantity(line.key, line.quantity + 1)} disabled={atLimit} aria-label={`Add one ${lineName(line)}`} title={atLimit ? "That's the most you can order" : undefined}>+</button>
    </div>
    <strong className="cart-row-total">{money(unit * line.quantity)}</strong>
    <button className="cart-row-remove" onClick={() => onRemove(line.key)} aria-label={`Remove ${lineName(line)} from your cart`}>Remove</button>
  </li>;
}
