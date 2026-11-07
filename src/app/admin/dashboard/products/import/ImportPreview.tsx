"use client";

import { useState } from "react";
import { money, shelfOf, shelves } from "@/lib/products";
import { ADMIN_PAGE_SIZE, Pager } from "../../../_shared/Pager";
import type { InventoryReading } from "./readInventory";

const cost = (value: number) => `Rs ${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

// What the file holds, shown before anything is saved.
export function ImportPreview({ reading }: { reading: InventoryReading }) {
  const { rows, problems, notes } = reading;
  const stockValue = rows.reduce((sum, row) => sum + row.qty * row.cost, 0);
  // Ten rows at a time, like every other table. The counts and the stock value above still cover the whole file.
  const [page, setPage] = useState(0);
  const current = Math.min(page, Math.max(0, Math.ceil(rows.length / ADMIN_PAGE_SIZE) - 1));
  const visible = rows.slice(current * ADMIN_PAGE_SIZE, (current + 1) * ADMIN_PAGE_SIZE);
  return <>
    <ul className="import-counts">
      {shelves.map(shelf => <li key={shelf.category}><b>{rows.filter(row => row.category === shelf.category).length}</b>{shelf.name}</li>)}
      <li><b>{cost(stockValue)}</b>Stock at cost</li>
    </ul>

    {problems.length > 0 && <div className="import-issues is-problem" role="alert">
      <h2>Skipped ({problems.length})</h2>
      <ul>{problems.map(item => <li key={`${item.line}-${item.message}`}>Row {item.line}: {item.message}</li>)}</ul>
    </div>}
    {notes.length > 0 && <div className="import-issues">
      <h2>Worth a look ({notes.length})</h2>
      <ul>{notes.map(item => <li key={`${item.line}-${item.message}`}>Row {item.line}: {item.message}</li>)}</ul>
    </div>}

    <div className="admin-table">
      <table>
        <thead><tr><th>Product</th><th>Shelf</th><th>Stock</th><th>Cost</th><th>Price</th></tr></thead>
        <tbody>{visible.map(row => <tr key={`${row.category}-${row.name}`}>
          <td>{row.name}</td>
          <td>{shelfOf(row.category).singular}</td>
          <td>{row.qty === 0 ? <small className="admin-hidden-tag is-sold">Sold out</small> : row.qty}</td>
          <td>{cost(row.cost)}</td>
          <td>{money(row.price)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <Pager page={current} shown={visible.length} total={rows.length} onPage={setPage} />
  </>;
}
