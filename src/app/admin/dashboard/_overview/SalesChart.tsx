import { CardHead } from "../../_shared/CardHead";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function SalesChart() {
  return <section className="admin-card admin-chart">
    <div className="admin-chart-head"><CardHead icon="revenue" title="Sales this week" /><span className="admin-tag">This week</span></div>
    <div className="admin-chart-plot" role="img" aria-label="No sales this week. Daily sales will appear here once checkout is connected.">
      {weekDays.map(day => <div key={day} className="admin-chart-day"><i /><span>{day}</span></div>)}
      <div className="admin-chart-note"><strong>No sales yet</strong><span>Daily sales will appear here once checkout is connected.</span></div>
    </div>
  </section>;
}
