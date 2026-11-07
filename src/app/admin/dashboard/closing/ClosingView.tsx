"use client";

import { useCallback, useEffect, useState } from "react";
import { money } from "@/lib/products";
import { AssetsCard } from "./AssetsCard";
import { closingApi, type MonthInputs, type MonthReport } from "./closingApi";

// Whole rupees, with a minus sign when below zero.
const rs = (value: number) => `${value < 0 ? "−" : ""}${money(Math.abs(Math.round(value)))}`;
const thisMonth = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date()).slice(0, 7);
const shift = (month: string, by: number) => {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, number - 1 + by, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};
const monthName = (month: string) => new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

// The boxes the owner types, with the names used on the Excel sheet.
const fields: [keyof MonthInputs, string][] = [
  ["cash", "Cash (held at month end)"],
  ["bank", "Bank (held at month end)"],
  ["rentPaid", "Shop rent paid"],
  ["electricPaid", "Electric bill paid"],
  ["personalInvestment", "Personal investment (money put in)"],
  ["investmentReturn", "Taken out of inventory money (Investment return back)"],
  ["withdrawalProfit", "Taken out of profit (added to Shop Expense)"],
  ["matchAmount", "Match Amount"],
];

const toText = (inputs: MonthInputs) => Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, value === null ? "" : String(value)]));

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <div className={strong ? "is-total" : ""}><dt>{label}</dt><dd>{rs(value)}</dd></div>;
}

// Monthly closing, worked out from the counter's records exactly like the owner's Excel sheet.
// Closing saves the figures but leaves the month open for fixes. Locking makes it read-only forever.
export function ClosingView() {
  const [month, setMonth] = useState(thisMonth);
  const [report, setReport] = useState<MonthReport | null>(null);
  const [text, setText] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [confirming, setConfirming] = useState<"close" | "lock" | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = (next: MonthReport) => { setReport(next); setText(toText(next.inputs)); };
  const load = useCallback(async () => {
    const reply = await closingApi.report(`${month}-01`);
    if (reply.ok) { setReport(reply.data); setText(toText(reply.data.inputs)); setStatus(""); } else setStatus(reply.error);
  }, [month]);
  useEffect(() => {
    let stale = false;
    closingApi.report(`${month}-01`).then(reply => {
      if (stale) return;
      if (reply.ok) { setReport(reply.data); setText(toText(reply.data.inputs)); setStatus(""); } else setStatus(reply.error);
    });
    return () => { stale = true; };
  }, [month]);

  async function act(action: () => ReturnType<typeof closingApi.save>, done: string) {
    setBusy(true);
    const reply = await action();
    setBusy(false);
    setConfirming(null);
    if (!reply.ok) return setStatus(reply.error);
    apply(reply.data);
    setStatus(done);
  }

  const locked = report?.locked ?? false;
  const cleaned = () => Object.fromEntries(Object.entries(text).map(([key, value]) => {
    const clean = value.replace(/[,\s]/g, "");
    return [key, clean === "" && key !== "oldAmount" && key !== "matchAmount" ? "0" : clean];
  }));
  const s = report?.sections;

  return <>
    <div className="admin-page-head">
      <h1 className="admin-title is-small">Monthly closing</h1>
      <div className="admin-head-actions cl-month">
        <button className="button button-outline" onClick={() => setMonth(shift(month, -1))} aria-label="Previous month">‹</button>
        <strong>{monthName(month)}</strong>
        <button className="button button-outline" onClick={() => setMonth(shift(month, 1))} disabled={month >= thisMonth()} aria-label="Next month">›</button>
      </div>
    </div>
    {report && <p className="admin-notice" role="status">{locked ? "This month is locked. It can never be changed." : report.closed ? `Closed on ${report.closedOn}. You can still fix things and close again.` : "This month is open."}</p>}
    {!report && !status && <p className="cl-muted">Loading…</p>}

    {report && s && <div className="cl-grid">
      <section className="admin-card cl-card" aria-labelledby="cl-sales">
        <h2 id="cl-sales" className="cl-title">Sales and profit</h2>
        <table className="cl-table">
          <thead><tr><th></th><th>Sales</th><th>Cost</th><th>Profit</th></tr></thead>
          <tbody>
            <tr><th>Hardware</th><td>{rs(s.hardware.sales)}</td><td>{rs(s.hardware.cost)}</td><td>{rs(s.hardware.profit)}</td></tr>
            <tr className="cl-sub"><th>incl. For Cash Adjustment</th><td>{rs(s.cashAdjustment.sales)}</td><td>{rs(s.cashAdjustment.cost)}</td><td>{rs(s.cashAdjustment.sales - s.cashAdjustment.cost)}</td></tr>
            <tr><th>Bottles</th><td>{rs(s.bottles.sales)}</td><td>{rs(s.bottles.cost)}</td><td>{rs(s.bottles.profit)}</td></tr>
            <tr><th>Coils</th><td>{rs(s.coils.sales)}</td><td>{rs(s.coils.cost)}</td><td>{rs(s.coils.profit)}</td></tr>
          </tbody>
          <tfoot><tr><th>Total</th><td>{rs(report.salesTotal)}</td><td>{rs(report.salesTotal - report.profit)}</td><td>{rs(report.profit)}</td></tr></tfoot>
        </table>
        <p className="cl-muted">For Cash Adjustment: refills {rs(s.cashAdjustment.refills)} in; Shipping, CMC Tax and Elite Tax {rs(s.cashAdjustment.taxes)} and refill bottles opened {rs(s.cashAdjustment.bottlesOpened)} out.</p>
        {report.onlineOrders > 0 && <p className="cl-muted">Online orders this month: {rs(report.onlineOrders)}. They are not in these totals.</p>}
      </section>

      <section className="admin-card cl-card" aria-labelledby="cl-net">
        <h2 id="cl-net" className="cl-title">Net profit</h2>
        <dl className="cl-rows">
          <Row label="Total profit" value={report.profit} />
          <Row label="Rent" value={-report.rent} />
          <Row label="Electric bill" value={-report.electric} />
          <Row label="Pay" value={-report.pay} />
          <Row label={`Shop Expense (expenses ${rs(report.directExpenses)}, stock written off ${rs(report.writeOffs)}, taken from profit ${rs(report.inputs.withdrawalProfit)})`} value={-report.shopExpense} />
          <Row label="Charity (1.5% of total profit)" value={-report.charity} />
          <Row label="Net profit" value={report.netProfit} strong />
        </dl>
      </section>

      <section className="admin-card cl-card" aria-labelledby="cl-restock">
        <h2 id="cl-restock" className="cl-title">Money check</h2>
        <dl className="cl-rows">
          <Row label="Old Amount (from last month)" value={report.oldAmount} />
          <Row label="Paid for restock (from Restock records)" value={report.paidRestock} />
          <Row label="Amount For Restock" value={report.restockAmount} strong />
          <Row label="Diff" value={report.diff} strong />
        </dl>
        <h3 className="cl-subtitle">Match check</h3>
        <dl className="cl-rows">
          <Row label="Amount in stock (at cost, right now)" value={report.stockValue} />
          <Row label="Amount in assets" value={report.assets} />
          <Row label="Amount in hand (Amount For Restock)" value={report.restockAmount} />
          <Row label="Total" value={report.matchTotal} strong />
          {report.matchDiff !== null && <Row label="Diff Amount (against Match Amount)" value={report.matchDiff} strong />}
        </dl>
      </section>

      <section className="admin-card cl-card" aria-labelledby="cl-inputs">
        <h2 id="cl-inputs" className="cl-title">Typed in for this month</h2>
        <form className="cl-inputs" onSubmit={event => { event.preventDefault(); void act(() => closingApi.save(`${month}-01`, cleaned()), "Saved."); }}>
          {report.firstMonth && <label className="field">Old Amount (first month only)<input inputMode="decimal" value={text.oldAmount ?? ""} disabled={locked} onChange={event => setText({ ...text, oldAmount: event.target.value })} /></label>}
          {fields.map(([key, label]) => <label key={key} className="field">{label}<input inputMode="numeric" value={text[key] ?? ""} disabled={locked} onChange={event => setText({ ...text, [key]: event.target.value })} /></label>)}
          {!locked && <button className="button button-black" type="submit" disabled={busy}>Save</button>}
        </form>
      </section>

      <section className="admin-card cl-card" aria-labelledby="cl-disc">
        <h2 id="cl-disc" className="cl-title">Discounts and extra charged</h2>
        <dl className="cl-rows">
          <div><dt>Discounts given ({report.discounts.count} sales)</dt><dd>{rs(report.discounts.total)}</dd></div>
          <div><dt>Last month</dt><dd>{rs(report.discounts.lastMonth)}</dd></div>
          <div><dt>Extra charged ({report.extra.count} sales)</dt><dd>{rs(report.extra.total)}</dd></div>
          <div><dt>Last month</dt><dd>{rs(report.extra.lastMonth)}</dd></div>
        </dl>
        {report.adjustedSales.length > 0 && <div className="admin-table is-cards cl-adjusted"><table>
          <thead><tr><th>Sale</th><th>Date</th><th>Items</th><th>Bill</th><th>Received</th><th>Difference</th></tr></thead>
          <tbody>{report.adjustedSales.map(sale => <tr key={sale.number}><td data-label="Sale">#{sale.number}</td><td data-label="Date">{sale.date}</td><td data-label="Items" data-wide>{sale.items}</td><td data-label="Bill">{rs(sale.listTotal)}</td><td data-label="Received">{rs(sale.total)}</td><td data-label="Difference">{sale.total < sale.listTotal ? `Discount ${rs(sale.listTotal - sale.total)}` : `Extra ${rs(sale.total - sale.listTotal)}`}</td></tr>)}</tbody>
        </table></div>}
      </section>

      <AssetsCard onChanged={load} />
    </div>}

    {report && !locked && <div className="cl-actions">
      {confirming === "close"
        ? <><span>{report.closed ? "Close the month again with today's figures?" : "Close the month?"}</span><button className="button button-black" disabled={busy} onClick={() => act(() => closingApi.close(`${month}-01`, false), "Month closed.")}>Yes, close</button><button className="button button-outline" onClick={() => setConfirming(null)}>Cancel</button></>
        : confirming === "lock"
        ? <><span>Lock {monthName(month)} forever? It can never be changed again.</span><button className="button button-black" disabled={busy} onClick={() => act(() => closingApi.close(`${month}-01`, true), "Month locked.")}>Yes, lock it</button><button className="button button-outline" onClick={() => setConfirming(null)}>Cancel</button></>
        : <><button className="button button-black" onClick={() => setConfirming("close")}>{report.closed ? "Close again" : "Close the month"}</button>{report.closed && <button className="button button-outline" onClick={() => setConfirming("lock")}>Lock month</button>}</>}
    </div>}
    <p className="form-status" role="status">{status}</p>
  </>;
}
