"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
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

type Field = { key: keyof MonthInputs; label: string; hint?: string; decimal?: boolean };

// The boxes the owner types, grouped. Hints give the name used on the Excel sheet.
const groups: { title: string; stack?: boolean; fields: Field[] }[] = [
  { title: "Money held at month end", fields: [{ key: "cash", label: "Cash" }, { key: "bank", label: "Bank" }] },
  { title: "Bills paid", fields: [{ key: "rentPaid", label: "Shop rent" }, { key: "electricPaid", label: "Electric bill" }] },
  { title: "Owner's money", stack: true, fields: [
    { key: "personalInvestment", label: "Put in", hint: "Personal investment" },
    { key: "investmentReturn", label: "Taken from inventory money", hint: "Investment return back" },
    { key: "withdrawalProfit", label: "Taken from profit", hint: "Added to Shop Expense" },
  ] },
  { title: "Settings and checks", fields: [
    { key: "charityPercent", label: "Charity %", hint: "Of total profit", decimal: true },
    { key: "matchAmount", label: "Match Amount", decimal: true },
  ] },
];

const toText = (inputs: MonthInputs) => Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, value === null || value === undefined ? "" : String(value)]));

function Row({ label, value, tone, sub }: { label: ReactNode; value: number; tone?: "total" | "minus"; sub?: boolean }) {
  return <div className={[tone === "total" ? "is-total" : "", sub ? "is-sub" : ""].join(" ").trim() || undefined}>
    <dt>{label}</dt><dd>{tone === "minus" ? rs(-value) : rs(value)}</dd>
  </div>;
}

function Line({ label, sales, cost, profit, kind }: { label: ReactNode; sales: number; cost: number; profit: number; kind?: "sub" | "subtotal" }) {
  return <tr className={kind ? `cl-${kind}` : undefined}><th scope="row">{label}</th><td data-label="Sales">{rs(sales)}</td><td data-label="Cost">{rs(cost)}</td><td data-label="Profit">{rs(profit)}</td></tr>;
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
    return [key, clean === "" && key !== "oldAmount" && key !== "matchAmount" && key !== "charityPercent" ? "0" : clean];
  }));
  const s = report?.sections;
  const on = report?.online;
  const input = (field: Field) => <label key={field.key} className="field cl-field">
    <span>{field.label}{field.hint && <small>{field.hint}</small>}</span>
    <input inputMode={field.decimal ? "decimal" : "numeric"} value={text[field.key] ?? ""} disabled={locked} onChange={event => setText({ ...text, [field.key]: event.target.value })} />
  </label>;

  return <>
    <div className="admin-page-head">
      <h1 className="admin-title is-small">Monthly closing</h1>
      <div className="admin-head-actions cl-month">
        <button className="button button-outline" onClick={() => setMonth(shift(month, -1))} aria-label="Previous month">‹</button>
        <strong>{monthName(month)}</strong>
        <button className="button button-outline" onClick={() => setMonth(shift(month, 1))} disabled={month >= thisMonth()} aria-label="Next month">›</button>
      </div>
    </div>

    {report && <div className={`cl-status${locked ? " is-locked" : report.closed ? " is-closed" : ""}`}>
      <p role="status">{locked ? "Locked. This month can never be changed." : report.closed ? `Closed on ${report.closedOn}. You can still fix things and close again.` : "Open. Figures update as the counter records sales."}</p>
      {!locked && <div className="cl-status-actions">
        {confirming === "close"
          ? <><span>{report.closed ? "Close again with today's figures?" : "Close the month?"}</span><button className="button button-black" disabled={busy} onClick={() => act(() => closingApi.close(`${month}-01`, false), "Month closed.")}>Yes, close</button><button className="button button-outline" onClick={() => setConfirming(null)}>Cancel</button></>
          : confirming === "lock"
          ? <><span>Lock forever? It can never be changed again.</span><button className="button button-black" disabled={busy} onClick={() => act(() => closingApi.close(`${month}-01`, true), "Month locked.")}>Yes, lock it</button><button className="button button-outline" onClick={() => setConfirming(null)}>Cancel</button></>
          : <><button className="button button-black" onClick={() => setConfirming("close")}>{report.closed ? "Close again" : "Close the month"}</button>{report.closed && <button className="button button-outline" onClick={() => setConfirming("lock")}>Lock month</button>}</>}
      </div>}
    </div>}
    <p className="form-status" role="status">{status}</p>
    {!report && !status && <p className="cl-muted">Loading…</p>}

    {report && s && <>
      <div className="cl-kpis">
        <div className="cl-kpi"><span>Total sales</span><b>{rs(report.salesTotal)}</b>{on && report.shop && <small>Shop {rs(report.shop.sales)} · Online {rs(on.sales)}</small>}</div>
        <div className="cl-kpi"><span>Total profit</span><b>{rs(report.profit)}</b>{on && report.shop && <small>Shop {rs(report.shop.profit)} · Online {rs(on.profit)}</small>}</div>
        <div className="cl-kpi is-key"><span>Net profit</span><b>{rs(report.netProfit)}</b><small>After rent, bills, pay, expenses, charity</small></div>
        <div className="cl-kpi"><span>Amount for restock</span><b>{rs(report.restockAmount)}</b><small>Money set aside to buy stock</small></div>
      </div>

      <div className="cl-layout">
        <div className="cl-col">
          <section className="admin-card cl-card" aria-labelledby="cl-sales">
            <h2 id="cl-sales" className="cl-title">Sales and profit</h2>
            <div className="cl-table-wrap"><table className="cl-table">
              <thead><tr><td /><th scope="col">Sales</th><th scope="col">Cost</th><th scope="col">Profit</th></tr></thead>
              <tbody>
                <tr className="cl-group"><th colSpan={4} scope="rowgroup">Shop counter</th></tr>
                <Line label="Hardware" {...s.hardware} />
                <Line label="incl. For Cash Adjustment" sales={s.cashAdjustment.sales} cost={s.cashAdjustment.cost} profit={s.cashAdjustment.sales - s.cashAdjustment.cost} kind="sub" />
                <Line label="Bottles" {...s.bottles} />
                <Line label="Coils" {...s.coils} />
                {report.shop && <Line label="Shop counter total" {...report.shop} kind="subtotal" />}
              </tbody>
              {on && <tbody>
                <tr className="cl-group"><th colSpan={4} scope="rowgroup">Online orders</th></tr>
                <Line label={`Goods (${on.count} delivered)`} sales={on.goods} cost={on.cost} profit={on.goods - on.cost} />
                <Line label="Delivery fees" sales={on.deliveryFees} cost={0} profit={on.deliveryFees} />
                {(on.pointsUsed ?? 0) > 0 && <Line label="Loyalty points used" sales={-(on.pointsUsed ?? 0)} cost={0} profit={-(on.pointsUsed ?? 0)} />}
                <Line label="Online total" sales={on.sales} cost={on.cost} profit={on.profit} kind="subtotal" />
              </tbody>}
              <tfoot><tr><th scope="row">Total</th><td data-label="Sales">{rs(report.salesTotal)}</td><td data-label="Cost">{rs(report.salesTotal - report.profit)}</td><td data-label="Profit">{rs(report.profit)}</td></tr></tfoot>
            </table></div>
            <ul className="cl-notes">
              <li>For Cash Adjustment: refills {rs(s.cashAdjustment.refills)} in. Shipping, CMC Tax and Elite Tax {rs(s.cashAdjustment.taxes)} and refill bottles opened {rs(s.cashAdjustment.bottlesOpened)} out.</li>
              {on && <li>Online orders count in the month they are delivered.{on.waitingCount > 0 ? ` ${on.waitingCount} placed this month (${rs(on.waiting)}) ${on.waitingCount === 1 ? "is" : "are"} not delivered yet.` : ""}</li>}
            </ul>
          </section>

          <section className="admin-card cl-card" aria-labelledby="cl-net">
            <h2 id="cl-net" className="cl-title">Net profit</h2>
            <dl className="cl-rows">
              <Row label="Total profit" value={report.profit} />
              <Row label="Rent" value={report.rent} tone="minus" />
              <Row label="Electric bill" value={report.electric} tone="minus" />
              <Row label="Pay" value={report.pay} tone="minus" />
              <Row label="Shop Expense" value={report.shopExpense} tone="minus" />
              <Row label="Expenses" value={report.directExpenses} sub />
              <Row label="Stock written off" value={report.writeOffs} sub />
              <Row label="Taken from profit" value={report.inputs.withdrawalProfit} sub />
              <Row label={`Charity (${report.charityPercent ?? 1.5}%)`} value={report.charity} tone="minus" />
              <Row label="Net profit" value={report.netProfit} tone="total" />
            </dl>
          </section>

          <section className="admin-card cl-card" aria-labelledby="cl-restock">
            <h2 id="cl-restock" className="cl-title">Money check</h2>
            <dl className="cl-rows">
              <Row label="Old Amount (from last month)" value={report.oldAmount} />
              <Row label="Paid for restock" value={report.paidRestock} />
              <Row label="Amount For Restock" value={report.restockAmount} tone="total" />
              <Row label="Diff" value={report.diff} tone="total" />
            </dl>
            <h3 className="cl-subtitle">Match check</h3>
            <dl className="cl-rows">
              <Row label="Stock (at cost, right now)" value={report.stockValue} />
              <Row label="Fixed assets" value={report.assets} />
              <Row label="Amount in hand (Amount For Restock)" value={report.restockAmount} />
              <Row label="Total" value={report.matchTotal} tone="total" />
              {report.matchDiff !== null && <Row label="Diff against Match Amount" value={report.matchDiff} tone="total" />}
            </dl>
          </section>
        </div>

        <div className="cl-col">
          <section className="admin-card cl-card" aria-labelledby="cl-inputs">
            <h2 id="cl-inputs" className="cl-title">Typed in for this month</h2>
            <form className="cl-inputs" onSubmit={event => { event.preventDefault(); void act(() => closingApi.save(`${month}-01`, cleaned()), "Saved."); }}>
              {report.firstMonth && <fieldset className="cl-fieldset is-stack"><legend>First month only</legend>{input({ key: "oldAmount", label: "Old Amount", decimal: true })}</fieldset>}
              {groups.map(group => <fieldset key={group.title} className={`cl-fieldset${group.stack ? " is-stack" : ""}`}>
                <legend>{group.title}</legend>
                {group.fields.filter(field => field.key !== "charityPercent" || report.inputs.charityPercent !== undefined).map(input)}
              </fieldset>)}
              {!locked && <button className="button button-black" type="submit" disabled={busy}>Save</button>}
            </form>
          </section>

          {report.points && <section className="admin-card cl-card" aria-labelledby="cl-points">
            <h2 id="cl-points" className="cl-title">Loyalty Club</h2>
            <dl className="cl-rows">
              <div><dt>Points used in the shop</dt><dd>{rs(report.points.shopUsed)}</dd></div>
              <div><dt>Points used online</dt><dd>{rs(report.points.onlineUsed)}</dd></div>
              <div className="is-sub"><dt>Already taken off sales above (1 point = Rs 1). Not counted as discounts.</dt><dd></dd></div>
              <div><dt>Points earned this month</dt><dd>{(report.points.shopEarned + report.points.onlineEarned).toLocaleString("en-US")}</dd></div>
              <div className="is-total"><dt>Points customers still hold</dt><dd>{rs(report.points.shopOut + report.points.onlineOut)}</dd></div>
              <div className="is-sub"><dt>Shop {report.points.shopOut.toLocaleString("en-US")} · Online {report.points.onlineOut.toLocaleString("en-US")}</dt><dd></dd></div>
            </dl>
          </section>}

          <AssetsCard onChanged={load} />

          <section className="admin-card cl-card" aria-labelledby="cl-disc">
            <h2 id="cl-disc" className="cl-title">Discounts and extra charged</h2>
            <dl className="cl-rows">
              <div><dt>Discounts given ({report.discounts.count} sales)</dt><dd>{rs(report.discounts.total)}</dd></div>
              <div className="is-sub"><dt>Last month</dt><dd>{rs(report.discounts.lastMonth)}</dd></div>
              <div><dt>Extra charged ({report.extra.count} sales)</dt><dd>{rs(report.extra.total)}</dd></div>
              <div className="is-sub"><dt>Last month</dt><dd>{rs(report.extra.lastMonth)}</dd></div>
            </dl>
            {report.adjustedSales.length > 0 && <div className="admin-table is-cards cl-adjusted"><table>
              <thead><tr><th>Sale</th><th>Date</th><th>Items</th><th>Bill</th><th>Received</th><th>Difference</th></tr></thead>
              <tbody>{report.adjustedSales.map(sale => <tr key={sale.number}><td data-label="Sale">#{sale.number}</td><td data-label="Date">{sale.date}</td><td data-label="Items" data-wide>{sale.items}</td><td data-label="Bill">{rs(sale.listTotal)}</td><td data-label="Received">{rs(sale.total)}</td><td data-label="Difference">{sale.total < sale.listTotal ? `Discount ${rs(sale.listTotal - sale.total)}` : `Extra ${rs(sale.total - sale.listTotal)}`}</td></tr>)}</tbody>
            </table></div>}
          </section>
        </div>
      </div>
    </>}
  </>;
}
