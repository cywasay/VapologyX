"use client";

import { useEffect, useState } from "react";
import { LOYALTY, points, type LoyaltyChannel } from "@/lib/loyalty";
import { money } from "@/lib/products";
import { EmptyState } from "../../_shared/EmptyState";
import { Icon } from "../../_shared/Icon";
import { ADMIN_PAGE_SIZE, Pager } from "../../_shared/Pager";
import { Pills } from "../../_shared/Pills";
import { TableSkeleton } from "../../_shared/TableSkeleton";
import { CustomerDialog } from "./CustomerDialog";
import { loyaltyApi, type MemberList, type MemberRow } from "./loyaltyApi";

const TABS: { value: LoyaltyChannel; label: string }[] = [{ value: "shop", label: "Shop" }, { value: "online", label: "Online" }];

// Loyalty Club members, kept apart by where they shop: the counter (Shop) or the website (Online).
// The same person can be in both tabs with two separate balances.
export function CustomersView() {
  const [channel, setChannel] = useState<LoyaltyChannel>("shop");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [list, setList] = useState<MemberList | null>(null);
  const [counts, setCounts] = useState<Record<LoyaltyChannel, number | string>>({ shop: "…", online: "…" });
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<MemberRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let stale = false;
    loyaltyApi.list(channel, query, page * ADMIN_PAGE_SIZE, ADMIN_PAGE_SIZE).then(reply => {
      if (stale) return;
      setFailed(!reply.ok);
      if (reply.ok) setList(reply.data);
    });
    return () => { stale = true; };
  }, [channel, query, page, refreshKey]);

  useEffect(() => {
    let stale = false;
    Promise.all(TABS.map(tab => loyaltyApi.list(tab.value, "", 0, 1))).then(([shop, online]) => {
      if (!stale) setCounts({ shop: shop.ok ? shop.data.total : "–", online: online.ok ? online.data.total : "–" });
    });
    return () => { stale = true; };
  }, [refreshKey]);

  return <>
    <div className="admin-page-head">
      <h1 className="admin-title is-small">Customers</h1>
      <p className="admin-note">{LOYALTY.name}: 1 point per Rs {LOYALTY.spendPerPoint} on full-price items, 1 point = Rs {LOYALTY.pointValue}, usable from {LOYALTY.minToUse.toLocaleString("en-US")} points, up to 20% of a bill, valid {LOYALTY.months} months.</p>
    </div>
    <Pills label="Shop or online customers" options={TABS} value={channel} onChange={next => { setChannel(next as LoyaltyChannel); setPage(0); setList(null); }} count={option => counts[option as LoyaltyChannel]} />
    <label className="admin-search">
      <Icon name="search" />
      <span className="sr-only">Search customers by mobile or name</span>
      <input type="search" placeholder="Search by mobile or name" value={search} onChange={event => setSearch(event.target.value)} />
    </label>
    {list && list.total > 0 && <p className="admin-notice" role="status">{channel === "shop" ? "Shop" : "Online"} customers hold {points(list.pointsOut)} in total (worth {money(list.pointsOut * LOYALTY.pointValue)}).</p>}
    {failed && <p className="form-status is-error" role="alert">We couldn&apos;t load the customers. Please refresh the page.</p>}
    {!failed && !list && <TableSkeleton label="Loading customers" headers={["Customer", "Balance", "Expiring soon", "Earned", "Used", "Last activity", ""]} />}
    {list && list.items.length === 0 && <EmptyState icon="customers" title={query ? "No customers match your search" : `No ${channel} members yet`}>
      {query ? "Try a mobile number or a name." : channel === "shop" ? "Customers join when staff enter their mobile number at the counter." : "Online customers join when their first order is delivered."}
    </EmptyState>}
    {list && list.items.length > 0 && <>
      <div className="admin-table is-cards">
        <table>
          <thead><tr><th>Customer</th><th>Balance</th><th>Expiring soon</th><th>Earned</th><th>Used</th><th>Last activity</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{list.items.map(row => <tr key={row.id}>
            <td data-label="Customer" data-wide><div className="admin-order-customer"><span>{row.name || "No name"}</span><small>{row.phone}</small></div></td>
            <td data-label="Balance"><strong>{points(row.balance)}</strong></td>
            <td data-label="Expiring soon">{row.expiring > 0 ? <span className="loyalty-expiring">{points(row.expiring)}</span> : "–"}</td>
            <td data-label="Earned">{row.earned.toLocaleString("en-US")}</td>
            <td data-label="Used">{row.used.toLocaleString("en-US")}</td>
            <td data-label="Last activity">{row.last}</td>
            <td data-wide><div className="admin-row-actions"><button className="admin-row-link" onClick={() => setOpen(row)} aria-label={`Open ${row.phone}`} title="Open"><Icon name="arrow" /></button></div></td>
          </tr>)}</tbody>
        </table>
      </div>
      <Pager page={page} pageSize={ADMIN_PAGE_SIZE} shown={list.items.length} total={list.total} onPage={setPage} />
    </>}
    {open && <CustomerDialog id={open.id} channel={channel} onClose={() => setOpen(null)} onChanged={() => setRefreshKey(key => key + 1)} />}
  </>;
}
