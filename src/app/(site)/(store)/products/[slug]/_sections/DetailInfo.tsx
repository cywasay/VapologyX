import Link from "next/link";
import { AddToCart } from "@/components/product/AddToCart";
import { fewLeft, isSoldOut, money, shelfOf, varietyPrice, type Product, type Variety } from "@/lib/products";

// The right-hand box: name, text, option picker, price and the add-to-cart button.
export function DetailInfo({ item, slug, variety, onVariety, coilCount, phone }: { item: Product; slug: string; variety: Variety | null; onVariety: (variety: Variety) => void; coilCount: number; phone: boolean }) {
  const soldOut = isSoldOut(item);
  const few = fewLeft(item);
  const description = item.description && <p key="description" className="detail-text">{item.description}</p>;
  const flavor = phone && (item.category === "bottle" || item.category === "disposable");
  const options = item.variants.length > 0 && <fieldset key="options" id={phone ? `${slug}-options` : undefined} className="variety-picker">
    <legend>{flavor ? "Choose a flavor: " : "Choose an option: "}<b>{variety?.name}</b></legend>
    <div>
      {item.variants.map(option => <label key={option.name} className={option.name === variety?.name ? "is-active" : ""}>
        <input type="radio" name={`${slug}-variety`} checked={option.name === variety?.name} onChange={() => onVariety(option)} />
        {option.name}
      </label>)}
    </div>
  </fieldset>;
  const buy = <div key="buy" className="detail-buy">
    {soldOut
      ? <p className="stock-note is-sold">Sold out right now. <Link href="/contact">Ask the store</Link> when it&apos;s back.</p>
      : few ? <p className="stock-note">Only {few} left in stock</p> : phone && <p className="stock-note">In stock</p>}
    <strong>{money(varietyPrice(item, variety))}{item.compare_price && !variety?.price ? <s className="price-was"><span className="sr-only">, was </span>{money(item.compare_price)}</s> : null}</strong>
    {!phone && <AddToCart item={item} variety={variety} />}
  </div>;
  const coils = coilCount > 0 && <a key="coils" className="text-link" href={`#${slug}-coils`}>{coilCount} compatible {coilCount === 1 ? "coil" : "coils"}</a>;

  return <div className="tile detail-info">
    <h1>{item.name}</h1>
    <p className="detail-tagline">{item.type || shelfOf(item.category).singular}</p>
    {phone ? [buy, options, coils, description] : [description, options, buy, coils]}
  </div>;
}
