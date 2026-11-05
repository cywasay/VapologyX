"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ProductForm } from "./admin-product-form";
import { AdminProducts, type ProductCounts, type ShelfFilter } from "./admin-products";
import { AdminSettings, Avatar, type Account } from "./admin-settings";
import { Icon, Pills } from "./admin-ui";
import { BottleArt } from "./art";
import { LIME, MINIMUM_AGE, money, shelves, type Product } from "./products";
import { categories } from "./site-blocks";
import { createClient } from "../utils/supabase/client";

type IconName = Parameters<typeof Icon>[0]["name"];

const views = [
  { name: "Overview", icon: "overview" },
  { name: "Orders", icon: "orders" },
  { name: "Products", icon: "products" },
  { name: "Customers", icon: "customers" },
  { name: "Messages", icon: "messages" },
  { name: "Settings", icon: "settings" },
] as const;
type View = typeof views[number]["name"];

const orderStatuses = ["All orders", "New", "Packed", "Delivered"];
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const orderOptions = orderStatuses.map(status => ({ value: status, label: status }));

async function loadProductCounts(): Promise<ProductCounts> {
  const supabase = createClient();
  const results = await Promise.all(shelves.map(shelf => supabase.from("products").select("id", { count: "exact", head: true }).eq("category", shelf.category)));
  const counts: ProductCounts = {};
  shelves.forEach((shelf, index) => { counts[shelf.category] = results[index].count ?? 0; });
  counts.all = results.reduce((sum, result) => sum + (result.count ?? 0), 0);
  return counts;
}

function EmptyMeter({ cells }: { cells: number }) {
  return <div className="admin-meter" aria-hidden="true">{Array.from({ length: cells }, (_, index) => <i key={index} />)}</div>;
}

function CardHead({ icon, title }: { icon: IconName; title: string }) {
  return <div className="admin-card-head"><span className="admin-chip"><Icon name={icon} /></span><h2>{title}</h2></div>;
}

function EmptyState({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return <div className="admin-empty"><span className="admin-chip"><Icon name={icon} /></span><strong>{title}</strong><p>{children}</p></div>;
}

export function AdminPanel() {
  const [view, setView] = useState<View>("Overview");
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [minimized, setMinimized] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState(orderStatuses[0]);
  const [shelf, setShelf] = useState<ShelfFilter>("all");
  const [counts, setCounts] = useState<ProductCounts>({});
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const logoutDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setAccount(data.user?.email ? { id: data.user.id, email: data.user.email, avatarUrl: data.user.user_metadata.avatar_url ?? null } : null);
    });
  }, []);

  useEffect(() => {
    loadProductCounts().then(setCounts);
  }, []);

  const viewIndex = (name: View) => views.findIndex(item => item.name === name);

  function open(next: View) {
    setDirection(viewIndex(next) < viewIndex(view) ? "up" : "down");
    setView(next);
    setDrawerOpen(false);
  }

  function openShelf(next: ShelfFilter) {
    setShelf(next);
    open("Products");
  }

  function openEditor(product: Product | "new") {
    setNotice("");
    setEditing(product);
  }

  function addProduct() {
    open("Products");
    openEditor("new");
  }

  function productSaved(message: string) {
    setEditing(null);
    setNotice(message);
    setRefreshKey(key => key + 1);
    loadProductCounts().then(setCounts);
  }

  function openOrders(status: string) {
    setOrderStatus(status);
    open("Orders");
  }

  function confirmLogOut() {
    setLogoutError("");
    logoutDialog.current?.showModal();
  }

  async function logOut() {
    setLoggingOut(true);
    setLogoutError("");
    const { error } = await createClient().auth.signOut();
    if (error) {
      setLoggingOut(false);
      setLogoutError("We couldn't log you out. Please try again.");
      return;
    }
    window.location.replace("/login");
  }

  return <div className={`admin ${minimized ? "is-minimized" : ""} ${drawerOpen ? "is-open" : ""}`}>
    <button className="admin-backdrop" aria-label="Close menu" tabIndex={drawerOpen ? 0 : -1} onClick={() => setDrawerOpen(false)} />
    <aside className="admin-side">
      <button className="admin-collapse" aria-expanded={!minimized} aria-label={minimized ? "Expand sidebar" : "Minimize sidebar"} onClick={() => setMinimized(!minimized)}><Icon name="chevron" /></button>
      <Link href="/" className="admin-brand" aria-label="VapologyX store"><span className="admin-logo">X</span><span className="admin-label">VapologyX</span></Link>
      <nav aria-label="Admin" className={`admin-nav is-moving-${direction}`} style={{ "--active": viewIndex(view), "--count": views.length } as CSSProperties}>
        <span className="admin-highlight" aria-hidden="true" />
        {views.map(item => <button key={item.name} title={minimized ? item.name : undefined} className={view === item.name ? "is-current" : ""} aria-current={view === item.name ? "page" : undefined} onClick={() => open(item.name)}>{item.name === "Settings" && account?.avatarUrl ? <span className="admin-avatar-slot"><Avatar account={account} size={32} /></span> : <Icon name={item.icon} />}<span className="admin-label">{item.name}</span></button>)}
      </nav>
      <div className="admin-nav admin-nav-bottom">
        <Link href="/" title={minimized ? "View store" : undefined}><Icon name="store" /><span className="admin-label">View store</span></Link>
        <button className="admin-logout" title={minimized ? "Log out" : undefined} onClick={confirmLogOut}><Icon name="logout" /><span className="admin-label">Log out</span></button>
      </div>
    </aside>

    <main className="admin-main">
      <div className="admin-topbar">
        <button className="admin-menu" aria-label="Open menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}><Icon name={drawerOpen ? "close" : "menu"} /></button>
        <Link href="/" className="button button-black"><Icon name="store" />View store</Link>
      </div>

      {view === "Overview" && <>
        <h1 className="admin-title">Managing your <span className="admin-title-chip"><Icon name="store" /></span> shop and <span className="admin-title-chip is-lime"><Icon name="spark" /></span> orders</h1>
        <Pills label="Order status" options={orderOptions} value="" onChange={openOrders} count={() => 0} />
        <div className="admin-overview">
          <div className="admin-overview-main">
            <div className="admin-cards">
              <section className="admin-card">
                <CardHead icon="orders" title="Orders to pack" />
                <p className="admin-figure">0</p>
                <p className="admin-caption">No orders waiting</p>
                <EmptyMeter cells={8} />
              </section>
              <section className="admin-card is-lime">
                <CardHead icon="revenue" title="Revenue" />
                <p className="admin-figure">{money(0)}</p>
                <p className="admin-caption">No sales yet</p>
                <EmptyMeter cells={7} />
              </section>
              <section className="admin-card is-black">
                <h2>Add a new product.</h2>
                <p>Photo, price and options, all in one place.</p>
                <button className="button button-white" onClick={addProduct}>Add product</button>
                <div className="admin-card-art" aria-hidden="true"><BottleArt color={LIME} /></div>
              </section>
            </div>
            <section className="admin-card admin-chart">
              <div className="admin-chart-head"><CardHead icon="revenue" title="Sales this week" /><span className="admin-tag">This week</span></div>
              <div className="admin-chart-plot" role="img" aria-label="No sales this week. Daily sales will appear here once checkout is connected.">
                {weekDays.map(day => <div key={day} className="admin-chart-day"><i /><span>{day}</span></div>)}
                <div className="admin-chart-note"><strong>No sales yet</strong><span>Daily sales will appear here once checkout is connected.</span></div>
              </div>
            </section>
          </div>
          <div className="admin-overview-side">
            <div className="admin-mini-row">
              <button className="admin-mini" onClick={() => open("Customers")}><span className="admin-chip"><Icon name="customers" /></span>Customers</button>
              <button className="admin-mini" onClick={() => open("Messages")}><span className="admin-chip"><Icon name="messages" /></span>Messages</button>
            </div>
            {shelves.map(item => <button key={item.category} className="admin-shelf" onClick={() => openShelf(item.category)}>
              <span className="admin-chip is-art">{categories.find(category => category.name === item.name)?.art}</span>
              <span><strong>{item.name}</strong><small>{counts[item.category] ?? "…"} products</small></span>
              <Icon name="arrow" />
            </button>)}
          </div>
        </div>
      </>}

      {view === "Orders" && <>
        <h1 className="admin-title is-small">Orders</h1>
        <Pills label="Filter orders" options={orderOptions} value={orderStatus} onChange={setOrderStatus} count={() => 0} />
        <EmptyState icon="orders" title={orderStatus === "All orders" ? "No orders yet" : `No ${orderStatus.toLowerCase()} orders`}>Orders will appear here once checkout is connected.</EmptyState>
      </>}

      {view === "Products" && <AdminProducts shelf={shelf} onShelfChange={setShelf} counts={counts} refreshKey={refreshKey} notice={notice} onAdd={() => openEditor("new")} onEdit={openEditor} />}

      {view === "Customers" && <>
        <h1 className="admin-title is-small">Customers</h1>
        <EmptyState icon="customers" title="Customer list not connected yet">Accounts from the Register page will appear here. Customers must be {MINIMUM_AGE} or older.</EmptyState>
      </>}

      {view === "Messages" && <>
        <h1 className="admin-title is-small">Messages</h1>
        <EmptyState icon="messages" title="No messages yet">Messages from the Contact page will appear here once they&apos;re saved to the database.</EmptyState>
      </>}

      {view === "Settings" && <>
        <h1 className="admin-title is-small">Settings</h1>
        <AdminSettings account={account} onAvatarChange={avatarUrl => setAccount(current => current && { ...current, avatarUrl })} />
      </>}
    </main>

    {editing && <ProductForm product={editing === "new" ? null : editing} defaultCategory={shelf === "all" ? "device" : shelf} onClose={() => setEditing(null)} onSaved={productSaved} />}

    <dialog ref={logoutDialog} className="confirm-dialog" aria-labelledby="logout-title" aria-describedby="logout-text" onClick={event => { if (event.target === event.currentTarget && !loggingOut) logoutDialog.current?.close(); }}>
      <div className="confirm-inner">
        <h2 id="logout-title">Log out?</h2>
        <p id="logout-text">You&apos;ll need to log in again to manage the shop.</p>
        <p className="form-status is-error" role="alert">{logoutError}</p>
        <div className="confirm-actions">
          <button className="button button-outline" autoFocus disabled={loggingOut} onClick={() => logoutDialog.current?.close()}>Cancel</button>
          <button className="button button-danger" disabled={loggingOut} onClick={logOut}>{loggingOut ? "Logging out…" : "Log out"}</button>
        </div>
      </div>
    </dialog>
  </div>;
}
