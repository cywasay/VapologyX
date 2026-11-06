import type { Order } from "@/lib/orders";

function nextSteps(order: Order) {
  const { method, city } = order.delivery;
  const steps = [`We message you on ${order.customer.phone} to confirm your order.`];
  if (order.payment === "transfer") steps.push("We send you the account details, and pack your order as soon as the payment arrives.");
  else steps.push(method === "pickup" ? "We pack your order and message you when it's ready to collect." : `We pack your order and send it to ${city}.`);
  if (order.payment === "cod") steps.push(method === "pickup" ? "You pay in cash when you collect it." : "You pay the rider in cash when it arrives.");
  steps.push("Keep your order number. You can use it to track your order at any time.");
  return steps;
}

export function NextSteps({ order }: { order: Order }) {
  return <div className="panel-light checkout-card">
    <h2>What happens next</h2>
    <ol className="next-steps">{nextSteps(order).map(step => <li key={step}>{step}</li>)}</ol>
  </div>;
}
