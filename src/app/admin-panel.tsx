"use client";

import Link from "next/link";
import { useState } from "react";
import { Wordmark } from "./art";
import { bottles, catalog, coils, devices, disposables, money } from "./products";
import { createClient } from "../utils/supabase/client";

const views = ["Overview", "Orders", "Products"] as const;
type View = typeof views[number];

// Sample data so the panel looks populated. None of it is real or stored.
const orders = [
  { id: "#0006", customer: "Customer 06", items: 3, total: 12500, status: "New" },
  { id: "#0005", customer: "Customer 05", items: 1, total: 5000, status: "New" },
  { id: "#0004", customer: "Customer 04", items: 2, total: 3000, status: "Packed" },
  { id: "#0003", customer: "Customer 03", items: 4, total: 16000, status: "Packed" },
  { id: "#0002", customer: "Customer 02", items: 1, total: 2000, status: "Delivered" },
  { id: "#0001", customer: "Customer 01", items: 2, total: 6000, status: "Delivered" },
];
const groups = [
  { name: "Device", items: devices },
  { name: "Disposable", items: disposables },
  { name: "Bottle", items: bottles },
  { name: "Coil", items: coils },
];
const products = groups.flatMap(group => group.items.map(item => ({ ...item, category: group.name })));
const revenue = orders.reduce((sum, order) => sum + order.total, 0);
const stats = [
  { label: "Revenue", value: money(revenue) },
  { label: "Orders", value: String(orders.length) },
  { label: "To pack", value: String(orders.filter(order => order.status === "New").length) },
  { label: "Products", value: String(catalog.length) },
];

function OrdersTable({ limit }: { limit?: number }) {
  return <div className="panel-light admin-table">
    <table>
      <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>{orders.slice(0, limit).map(order => <tr key={order.id}>
        <td>{order.id}</td><td>{order.customer}</td><td>{order.items}</td><td>{money(order.total)}</td>
        <td><span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function ProductsTable() {
  return <div className="panel-light admin-table">
    <table>
      <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th></tr></thead>
      <tbody>{products.map((product, index) => <tr key={product.id}>
        <td>{product.name}</td><td>{product.category}</td><td>{money(product.price)}</td><td>{10 + (index * 7) % 40}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function AdminPanel() {
  const [view, setView] = useState<View>("Overview");

  async function logOut() {
    await createClient().auth.signOut();
    window.location.replace("/login");
  }

  return <div className="admin">
    <aside className="tile admin-side">
      <Link href="/" aria-label="Go to the store"><Wordmark /></Link>
      <nav aria-label="Admin">
        {views.map(item => <button key={item} className={view === item ? "is-current" : ""} aria-current={view === item ? "page" : undefined} onClick={() => setView(item)}>{item}</button>)}
      </nav>
      <div className="admin-side-links">
        <Link href="/">View store</Link>
        <button onClick={logOut}>Log out</button>
      </div>
    </aside>
    <main className="admin-main">
      <header className="admin-head"><h1>{view}</h1><span className="badge-static">Sample data</span></header>
      {view === "Overview" && <>
        <div className="admin-stats">
          {stats.map(stat => <div key={stat.label} className="tile admin-stat"><span>{stat.label}</span><strong>{stat.value}</strong></div>)}
        </div>
        <h2>Latest orders</h2>
        <OrdersTable limit={4} />
      </>}
      {view === "Orders" && <OrdersTable />}
      {view === "Products" && <ProductsTable />}
    </main>
  </div>;
}
