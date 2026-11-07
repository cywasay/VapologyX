import Link from "next/link";
import { ProductArt } from "@/components/art";
import { money, productHref, shelfOf, type Product } from "@/lib/products";
import { Icon } from "../../_shared/Icon";

function ProductRow({ item, onEdit }: { item: Product; onEdit: (product: Product) => void }) {
  return <tr>
    <td data-wide><div className="admin-product"><div className="cart-thumb"><ProductArt item={item} sizes="48px" /></div><span>{item.name}{!item.is_published && <small className="admin-hidden-tag">Hidden</small>}{item.stock === 0 && <small className="admin-hidden-tag is-sold">Sold out</small>}</span></div></td>
    <td data-label="Category">{shelfOf(item.category).singular}</td>
    <td data-label="Price">{money(item.price)}</td>
    <td data-label="Stock">{item.stock ?? "—"}</td>
    <td data-label="Options">{item.variants.length || "—"}</td>
    <td data-wide><div className="admin-row-actions">
      <button className="admin-row-link" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} title="Edit"><Icon name="edit" /></button>
      {item.is_published && <Link href={productHref(item)} aria-label={`View ${item.name} in the shop`} title="View in shop" className="admin-row-link"><Icon name="arrow" /></Link>}
    </div></td>
  </tr>;
}

export function ProductsTable({ items, onEdit }: { items: Product[]; onEdit: (product: Product) => void }) {
  return <div className="admin-table is-cards">
    <table>
      <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Options</th><th><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{items.map(item => <ProductRow key={item.id} item={item} onEdit={onEdit} />)}</tbody>
    </table>
  </div>;
}
