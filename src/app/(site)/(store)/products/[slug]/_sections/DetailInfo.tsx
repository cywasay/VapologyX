import Link from "next/link";
import { AddToCart } from "@/components/product/AddToCart";
import { fewLeft, isSoldOut, money, shelfOf, varietyPrice, type Product, type Variety } from "@/lib/products";

// The right-hand box: name, text, option picker, price and the add-to-cart button.
export function DetailInfo({ item, slug, variety, onVariety, coilCount }: { item: Product; slug: string; variety: Variety | null; onVariety: (variety: Variety) => void; coilCount: number }) {
  const soldOut = isSoldOut(item);
  const few = fewLeft(item);
  return <div className="tile detail-info">
    <h1>{item.name}</h1>
    <p className="detail-tagline">{item.type || shelfOf(item.category).singular}</p>
    {item.description && <p className="detail-text">{item.description}</p>}
    {item.variants.length > 0 && <fieldset className="variety-picker">
      <legend>Choose an option: <b>{variety?.name}</b></legend>
      <div>
        {item.variants.map(option => <label key={option.name} className={option.name === variety?.name ? "is-active" : ""}>
          <input type="radio" name={`${slug}-variety`} checked={option.name === variety?.name} onChange={() => onVariety(option)} />
          {option.name}
        </label>)}
      </div>
    </fieldset>}
    <div className="detail-buy">
      {soldOut
        ? <p className="stock-note is-sold">Sold out right now. <Link href="/contact">Ask the store</Link> when it&apos;s back.</p>
        : few && <p className="stock-note">Only {few} left in stock</p>}
      <strong>{money(varietyPrice(item, variety))}</strong>
      <AddToCart item={item} variety={variety} />
    </div>
    {coilCount > 0 && <a className="text-link" href={`#${slug}-coils`}>{coilCount} compatible {coilCount === 1 ? "coil" : "coils"}</a>}
  </div>;
}
