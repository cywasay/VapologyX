import { OrderDetails } from "@/components/flow/OrderDetails";
import { OrderNumber } from "@/components/flow/OrderNumber";
import { OrderSummary } from "@/components/flow/OrderSummary";
import { StatusTimeline } from "@/components/flow/StatusTimeline";
import type { Order } from "@/lib/orders";

export function TrackResult({ order }: { order: Order }) {
  return <div className="order-layout track-result">
    <div className="order-main">
      <div className="track-head"><span>Order</span><OrderNumber number={order.number} /></div>
      <StatusTimeline order={order} />
      <div className="panel-light checkout-card">
        <h2>Your details</h2>
        <OrderDetails order={order} />
      </div>
    </div>
    <OrderSummary order={order} />
  </div>;
}
