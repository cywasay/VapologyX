"use client";

import type { CSSProperties } from "react";
import { money } from "@/lib/products";
import { CardHead } from "../../_shared/CardHead";
import { useDashboardStats } from "../_data/DashboardStats";

const weekday = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" });
const longDay = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

// The last seven days of sales, counter and online stacked in each bar. The bars grow up from the baseline when the page opens,
// hovering or tabbing to one shows its figures, and a table for screen readers holds the same numbers.
export function SalesChart() {
  const { stats, failed } = useDashboardStats();
  const days = stats?.days ?? [];
  const peak = Math.max(0, ...days.map(day => day.counter + day.online));
  return <section className="admin-card admin-chart">
    <div className="admin-chart-head">
      <CardHead icon="revenue" title="Sales, last 7 days" />
      <ul className="admin-legend"><li><i className="is-counter" />Counter</li><li><i className="is-online" />Online</li></ul>
    </div>
    <div className="admin-chart-plot keep-motion">
      {peak > 0 && <span className="admin-chart-max" aria-hidden="true">{money(peak)}</span>}
      {days.map((day, index) => {
        const total = day.counter + day.online;
        return <div key={day.day} className="admin-bar" tabIndex={0} aria-label={`${longDay(day.day)}: ${money(total)}. Counter ${money(day.counter)}, online ${money(day.online)}.`} style={{ "--n": index } as CSSProperties}>
          <div className="admin-bar-col">
            <div className="admin-bar-stack" style={{ height: `${peak ? (total / peak) * 100 : 0}%` }}>
              {day.online > 0 && <span className="is-online" style={{ flexGrow: day.online }} />}
              {day.counter > 0 && <span className="is-counter" style={{ flexGrow: day.counter }} />}
            </div>
          </div>
          <span className="admin-bar-label">{weekday(day.day)}</span>
          <div className="admin-bar-tip" aria-hidden="true">
            <strong>{money(total)}</strong>
            <span>Counter {money(day.counter)}</span>
            <span>Online {money(day.online)}</span>
          </div>
        </div>;
      })}
      {(failed || (stats && peak === 0)) && <div className="admin-chart-note"><strong>{failed ? "Couldn't load the chart" : "No sales yet this week"}</strong><span>{failed ? "Please refresh the page." : "Counter sales and online orders will show up here."}</span></div>}
      {!stats && !failed && <div className="admin-chart-note"><strong>Loading</strong></div>}
    </div>
    <table className="sr-only">
      <caption>Sales for each of the last seven days</caption>
      <thead><tr><th>Day</th><th>Counter</th><th>Online</th></tr></thead>
      <tbody>{days.map(day => <tr key={day.day}><td>{longDay(day.day)}</td><td>{money(day.counter)}</td><td>{money(day.online)}</td></tr>)}</tbody>
    </table>
  </section>;
}
