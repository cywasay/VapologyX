import { AddProductCard } from "./_overview/AddProductCard";
import { OrderStatusPills } from "./_overview/OrderStatusPills";
import { OrdersCard } from "./_overview/OrdersCard";
import { OverviewTitle } from "./_overview/OverviewTitle";
import { QuickLinks } from "./_overview/QuickLinks";
import { SalesTodayCard } from "./_overview/SalesTodayCard";
import { StatRow } from "./_overview/StatRow";
import { DashboardStatsProvider } from "./_data/DashboardStats";
import { SalesChart } from "./_overview/SalesChart";
import { ShelfShortcuts } from "./_overview/ShelfShortcuts";

export default function OverviewPage() {
  return <DashboardStatsProvider>
    <OverviewTitle />
    <OrderStatusPills />
    <div className="admin-overview">
      <div className="admin-overview-main">
        <div className="admin-cards">
          <OrdersCard />
          <SalesTodayCard />
          <AddProductCard />
        </div>
        <StatRow />
        <SalesChart />
      </div>
      <div className="admin-overview-side">
        <QuickLinks />
        <ShelfShortcuts />
      </div>
    </div>
  </DashboardStatsProvider>;
}
