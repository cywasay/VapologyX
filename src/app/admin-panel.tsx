"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AdminSettings, Avatar, type Account } from "./admin-settings";
import { BottleArt, ProductArt } from "./art";
import { LIME, MINIMUM_AGE, catalog, money, productHref, shelves, shelfOf } from "./products";
import { categories } from "./site-blocks";
import { createClient } from "../utils/supabase/client";

const icons = {
  overview: "M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z",
  orders: "M4 8l8-4 8 4v8l-8 4-8-4ZM4 8l8 4 8-4M12 12v8",
  products: "M4 4h7v7H4ZM13 4h7v7h-7ZM4 13h7v7H4ZM13 13h7v7h-7Z",
  customers: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5c1.9.8 3 2.8 3 5.5",
  messages: "M4 5h16v11H9l-5 4Z",
  settings: "M4 7h9M18 7h2M4 17h2M11 17h9M15.5 4.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM8.5 14.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z",
  store: "M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9c0 4 5.3 4 5.3 0 0 4 5.4 4 5.4 0 0 4 5.3 4 5.3 0M10 20v-5h4v5",
  logout: "M10 4H5v16h5M15 8l4 4-4 4M9 12h10",
  chevron: "m14 6-6 6 6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "m6 6 12 12M18 6 6 18",
  arrow: "M7 17 17 7M9 7h8v8",
  revenue: "M4 17l5-5 4 4 7-8M15 8h5v5",
  spark: "M12 4l1.8 6.2L20 12l-6.2 1.8L12 20l-1.8-6.2L4 12l6.2-1.8Z",
};

function Icon({ name }: { name: keyof typeof icons }) {
  return <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={icons[name]} /></svg>;
}

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

function Pills({ label, options, value, onChange, count }: { label: string; options: string[]; value: string; onChange: (option: string) => void; count: (option: string) => number }) {
  return <div className="admin-pills" role="group" aria-label={label}>
    {options.map(option => <button key={option} className={value === option ? "is-active" : ""} aria-pressed={value === option} onClick={() => onChange(option)}>{option} <span>{count(option)}</span></button>)}
  </div>;
}

function EmptyMeter({ cells }: { cells: number }) {
  return <div className="admin-meter" aria-hidden="true">{Array.from({ length: cells }, (_, index) => <i key={index} />)}</div>;
}

function CardHead({ icon, title }: { icon: keyof typeof icons; title: string }) {
  return <div className="admin-card-head"><span className="admin-chip"><Icon name={icon} /></span><h2>{title}</h2></div>;
}

function EmptyState({ icon, title, children }: { icon: keyof typeof icons; title: string; children: ReactNode }) {
  return <div className="admin-empty"><span className="admin-chip"><Icon name={icon} /></span><strong>{title}</strong><p>{children}</p></div>;
}

export function AdminPanel() {
  const [view, setView] = useState<View>("Overview");
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [minimized, setMinimized] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState(orderStatuses[0]);
  const [shelf, setShelf] = useState("All products");
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const logoutDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setAccount(data.user?.email ? { id: data.user.id, email: data.user.email, avatarUrl: data.user.user_metadata.avatar_url ?? null } : null);
    });
  }, []);

  const shelfOptions = ["All products", ...shelves.map(item => item.name)];
  const shelfCount = (name: string) => name === "All products" ? catalog.length : shelves.find(item => item.name === name)?.items.length ?? 0;
  const shownProducts = shelf === "All products" ? catalog : shelves.find(item => item.name === shelf)?.items ?? [];

  const viewIndex = (name: View) => views.findIndex(item => item.name === name);

  function open(next: View) {
    setDirection(viewIndex(next) < viewIndex(view) ? "up" : "down");
    setView(next);
    setDrawerOpen(false);
  }

  function openShelf(name: string) {
    setShelf(name);
    open("Products");
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
        <Pills label="Order status" options={orderStatuses} value="" onChange={openOrders} count={() => 0} />
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
                <h2>Add your real products.</h2>
                <p>The {catalog.length} products in the shop are still placeholders.</p>
                <button className="button button-white" onClick={() => openShelf("All products")}>Manage products</button>
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
            {categories.map(item => <button key={item.name} className="admin-shelf" onClick={() => openShelf(item.name)}>
              <span className="admin-chip is-art">{item.art}</span>
              <span><strong>{item.name}</strong><small>{shelfCount(item.name)} products</small></span>
              <Icon name="arrow" />
            </button>)}
          </div>
        </div>
      </>}

      {view === "Orders" && <>
        <h1 className="admin-title is-small">Orders</h1>
        <Pills label="Filter orders" options={orderStatuses} value={orderStatus} onChange={setOrderStatus} count={() => 0} />
        <EmptyState icon="orders" title={orderStatus === "All orders" ? "No orders yet" : `No ${orderStatus.toLowerCase()} orders`}>Orders will appear here once checkout is connected.</EmptyState>
      </>}

      {view === "Products" && <>
        <h1 className="admin-title is-small">Products</h1>
        <Pills label="Filter products" options={shelfOptions} value={shelf} onChange={setShelf} count={shelfCount} />
        <p className="admin-note">These are the placeholder products currently shown in the shop.</p>
        <div className="admin-table">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th><span className="sr-only">Open</span></th></tr></thead>
            <tbody>{shownProducts.map(item => <tr key={item.id}>
              <td><div className="admin-product"><div className="cart-thumb"><ProductArt item={item} /></div>{item.name}</div></td>
              <td>{shelfOf(item)?.name}</td>
              <td>{money(item.price)}</td>
              <td><Link href={productHref(item)} aria-label={`View ${item.name} in the shop`} className="admin-row-link"><Icon name="arrow" /></Link></td>
            </tr>)}</tbody>
          </table>
        </div>
      </>}

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
