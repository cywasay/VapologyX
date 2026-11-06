import { ProductArt } from "@/components/art";
import { money, shelves } from "@/lib/products";
import { LIME } from "@/lib/products";
import type { Counter } from "../useCounter";
import type { CounterItem, Shelf } from "../types";

const tabs: { id: Shelf | "all"; label: string }[] = [{ id: "all", label: "All" }, ...shelves.map(shelf => ({ id: shelf.category, label: shelf.name }))];

// The shelf tabs, the search box and one big tile per item. Tapping a tile adds it to the sale.
export function ItemGrid({ counter, shelf, onShelf, search, onSearch }: { counter: Counter; shelf: Shelf | "all"; onShelf: (shelf: Shelf | "all") => void; search: string; onSearch: (text: string) => void }) {
  const shown = counter.items.filter((item: CounterItem) => (shelf === "all" || item.shelf === shelf) && item.name.toLowerCase().includes(search.trim().toLowerCase()));
  const inSale = (id: string) => counter.lines.find(line => line.item.id === id)?.quantity ?? 0;
  return <div className="ct-items">
    <div className="ct-tabs" role="group" aria-label="Shelf">
      {tabs.map(tab => <button key={tab.id} className={shelf === tab.id ? "is-current" : ""} aria-pressed={shelf === tab.id} onClick={() => onShelf(tab.id)}>{tab.label}</button>)}
    </div>
    <input className="ct-search" type="search" placeholder="Search or scan an item" aria-label="Search items" value={search} onChange={event => onSearch(event.target.value)} />
    <div className="ct-grid">
      {shown.map(item => {
        const left = item.stock - inSale(item.id);
        return <button key={item.id} className={`ct-item ${left <= 0 ? "is-out" : ""}`} onClick={() => counter.add(item.id)} disabled={left <= 0}>
          <span className="ct-item-art"><ProductArt item={{ name: item.name, category: item.shelf, type: item.type, color: LIME, image_url: null }} sizes="96px" /></span>
          <strong>{item.name}</strong>
          <span>{money(item.price)}</span>
          <em>{left <= 0 ? "Sold out" : left <= 2 ? `Only ${left} left` : `${left} in stock`}</em>
          {inSale(item.id) > 0 && <b className="ct-badge">{inSale(item.id)}</b>}
        </button>;
      })}
      {shown.length === 0 && <p className="ct-empty">No items match.</p>}
    </div>
  </div>;
}
