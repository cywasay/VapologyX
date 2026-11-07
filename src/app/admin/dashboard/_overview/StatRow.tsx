"use client";

import Link from "next/link";
import { money } from "@/lib/products";
import { AnimatedNumber } from "../../_shared/AnimatedNumber";
import { todayAndYesterday, useDashboardStats } from "../_data/DashboardStats";

// Three smaller numbers: refill money today, what was spent today, and products that need restocking.
export function StatRow() {
  const { stats, failed } = useDashboardStats();
  const { today } = todayAndYesterday(stats);
  const shown = (value: number | undefined, format?: (value: number) => string) => stats && value !== undefined ? <AnimatedNumber value={value} format={format} /> : failed ? "—" : "…";
  return <div className="admin-stat-row">
    <section className="admin-card admin-stat">
      <p className="admin-stat-label">Refills today</p>
      <p className="admin-stat-figure">{shown(today?.refills, money)}</p>
    </section>
    <section className="admin-card admin-stat">
      <p className="admin-stat-label">Expenses today</p>
      <p className="admin-stat-figure">{shown(today?.expenses, money)}</p>
    </section>
    <Link href="/admin/dashboard/products" className="admin-card admin-stat is-link">
      <p className="admin-stat-label">Low on stock</p>
      <p className="admin-stat-figure">{shown(stats?.lowStock)}</p>
      <p className="admin-caption">{stats ? `5 or fewer left. ${stats.soldOut} sold out.` : ""}</p>
    </Link>
  </div>;
}
