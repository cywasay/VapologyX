import type { Category } from "./products";

// Placeholder shop rules. The client's answers will replace these, and later a Store settings page in the admin will hold them.
export const DELIVERY_FEE = 250;
export const FREE_DELIVERY_FROM = 10000;

export const DELIVERY_METHODS = [
  { id: "delivery", label: "Home delivery" },
  { id: "pickup", label: "Store pickup" },
] as const;

export const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on delivery" },
  { id: "transfer", label: "Bank transfer or mobile wallet" },
] as const;

export const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Hyderabad", "Sialkot", "Gujranwala"];

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]["id"];
export type PaymentId = (typeof PAYMENT_METHODS)[number]["id"];
export type OrderStatus = "placed" | "confirmed" | "shipped" | "delivered" | "cancelled";

// The steps an order moves through, in order. "cancelled" can happen at any point.
export const ORDER_STEPS: OrderStatus[] = ["placed", "confirmed", "shipped", "delivered"];

const STATUS_TEXT: Record<OrderStatus, { label: string; pickupLabel?: string; note: string; pickupNote?: string }> = {
  placed: { label: "Order received", note: "We've got your order and will message you to confirm it." },
  confirmed: { label: "Confirmed", note: "Your order is confirmed and being packed." },
  shipped: { label: "On its way", pickupLabel: "Ready to collect", note: "Your order is on its way to you.", pickupNote: "Your order is packed and waiting for you at the store." },
  delivered: { label: "Delivered", pickupLabel: "Collected", note: "Your order has arrived. Enjoy!", pickupNote: "You've collected your order. Enjoy!" },
  cancelled: { label: "Cancelled", note: "This order was cancelled. Contact the store if you have any questions." },
};

export const statusLabel = (status: OrderStatus, method: DeliveryMethod) => (method === "pickup" && STATUS_TEXT[status].pickupLabel) || STATUS_TEXT[status].label;
export const statusNote = (status: OrderStatus, method: DeliveryMethod) => (method === "pickup" && STATUS_TEXT[status].pickupNote) || STATUS_TEXT[status].note;

export const paymentLabel = (id: PaymentId) => PAYMENT_METHODS.find(method => method.id === id)?.label ?? id;
export const paymentNote = (id: PaymentId, method: DeliveryMethod) => id === "cod"
  ? (method === "pickup" ? "Pay in cash when you collect your order." : "Pay the rider in cash when your order arrives.")
  : "We message you the account details to confirm your order.";

export type OrderLine = {
  productId: string;
  slug: string;
  name: string;
  variety: string | null;
  unitPrice: number;
  quantity: number;
  category: Category;
  type: string;
  color: string;
  image_url: string | null;
};

export type Order = {
  number: string;
  createdAt: string;
  status: OrderStatus;
  customer: { name: string; phone: string; email: string };
  delivery: { method: DeliveryMethod; address: string; city: string; notes: string };
  payment: PaymentId;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

export type OrderDraft = Pick<Order, "customer" | "delivery" | "payment" | "lines">;

export function orderTotals(subtotal: number, method: DeliveryMethod) {
  const deliveryFee = method === "delivery" && subtotal > 0 && subtotal < FREE_DELIVERY_FROM ? DELIVERY_FEE : 0;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

// Pakistani mobile numbers: 0300 1234567, +92 300 1234567 and 923001234567 all give 03001234567.
export function normalizePhone(input: string): string | null {
  const match = /^(?:\+92|0092|92|0)?(3\d{9})$/.exec(input.replace(/[\s\-().]/g, ""));
  return match ? `0${match[1]}` : null;
}

// No 0, O, 1 or I, so an order number is easy to read out over the phone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeOrderNumber() {
  return `VX-${Array.from(crypto.getRandomValues(new Uint8Array(6)), byte => ALPHABET[byte % ALPHABET.length]).join("")}`;
}

// The two functions below keep orders in this browser, for the demo. When the back end exists, replace
// their bodies with database calls: the cart, checkout, confirmation and tracking pages only use these two.
const ORDERS_KEY = "vx-orders-v1";
const KEEP_ORDERS = 25;

function readOrders(): Order[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ORDERS_KEY) ?? "null");
    const stored = (parsed as { orders?: unknown } | null)?.orders;
    return Array.isArray(stored) ? stored.filter((entry): entry is Order => Boolean(entry && typeof entry.number === "string" && Array.isArray(entry.lines) && entry.customer && entry.delivery)) : [];
  } catch {
    return [];
  }
}

export async function placeOrder(draft: OrderDraft): Promise<Order> {
  const subtotal = draft.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const order: Order = { ...draft, number: makeOrderNumber(), createdAt: new Date().toISOString(), status: "placed", ...orderTotals(subtotal, draft.delivery.method) };
  localStorage.setItem(ORDERS_KEY, JSON.stringify({ v: 1, orders: [order, ...readOrders()].slice(0, KEEP_ORDERS) }));
  return order;
}

// With a phone number the order is only returned when it matches, like the "track my order" page asks.
export async function findOrder(number: string, phone?: string): Promise<Order | null> {
  const wanted = number.trim().toUpperCase();
  const order = readOrders().find(entry => entry.number === wanted);
  if (!order) return null;
  if (phone !== undefined && normalizePhone(phone) !== normalizePhone(order.customer.phone)) return null;
  return order;
}
