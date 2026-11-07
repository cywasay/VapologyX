"use client";

import type { CSSProperties } from "react";
import { money } from "@/lib/products";
import { AnimatedNumber } from "../../_shared/AnimatedNumber";
import { CardHead } from "../../_shared/CardHead";
import { todayAndYesterday, useDashboardStats } from "../_data/DashboardStats";
import { Delta } from "./Delta";

// Everything taken today: counter sales and online orders (voided and cancelled ones left out), against yesterday.
export function SalesTodayCard() {
  const { stats, failed } = useDashboardStats();
  const { today, yesterday } = todayAndYesterday(stats);
  const total = today ? today.counter + today.online : 0;
  const before = yesterday ? yesterday.counter + yesterday.online : 0;
  const week = (stats?.days ?? []).map(day => day.counter + day.online);
  const peak = Math.max(1, ...week);
  return <section className="admin-card is-lime">
    <CardHead icon="revenue" title="Sales today" />
    <p className="admin-figure">{stats ? <AnimatedNumber value={total} format={money} /> : failed ? "—" : "…"}</p>
    <p className="admin-caption">{failed ? "Couldn't load the numbers" : !today ? "Loading" : `Counter ${money(today.counter)} · Online ${money(today.online)}`}</p>
    {today && <Delta now={total} before={before} />}
    <div className="admin-spark keep-motion" aria-hidden="true">
      {week.map((value, index) => <i key={index} className={index === week.length - 1 ? "is-today" : ""} style={{ "--h": `${Math.max(8, (value / peak) * 100)}%`, "--n": index } as CSSProperties} />)}
    </div>
  </section>;
}
