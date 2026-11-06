import type { CartLine } from "@/lib/cart-store";
import { lineUnitPrice } from "@/lib/cart-store";
import { DELIVERY_METHODS, PAYMENT_METHODS, normalizePhone, type DeliveryMethod, type OrderLine, type PaymentId } from "@/lib/orders";
import { MINIMUM_AGE } from "@/lib/products";

export const DRAFT_KEY = "vx-checkout-v1";

export type Values = { name: string; phone: string; email: string; method: DeliveryMethod; address: string; city: string; notes: string; payment: PaymentId; age: boolean };
export type Field = "name" | "phone" | "email" | "address" | "city" | "age";
export type Errors = Partial<Record<Field, string>>;
export type SetValue = <K extends keyof Values>(key: K, value: Values[K]) => void;

export const FIELD_ORDER: Field[] = ["name", "phone", "email", "address", "city", "age"];
export const BLANK: Values = { name: "", phone: "", email: "", method: "delivery", address: "", city: "", notes: "", payment: "cod", age: false };

// Contact and address details are remembered for next time. The notes and the age tick box never are.
export function readDraft(): Values {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as Partial<Values> | null;
    if (!saved) return BLANK;
    const text = (value: unknown) => typeof value === "string" ? value.slice(0, 300) : "";
    return {
      ...BLANK,
      name: text(saved.name),
      phone: text(saved.phone),
      email: text(saved.email),
      address: text(saved.address),
      city: text(saved.city),
      method: DELIVERY_METHODS.find(method => method.id === saved.method)?.id ?? "delivery",
      payment: PAYMENT_METHODS.find(method => method.id === saved.payment)?.id ?? "cod",
    };
  } catch {
    return BLANK;
  }
}

export function validate(values: Values): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!normalizePhone(values.phone)) errors.phone = "Enter a mobile number like 0300 1234567.";
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "That email doesn't look right.";
  if (values.method === "delivery") {
    if (values.address.trim().length < 8) errors.address = "Enter your full address, with the house or street.";
    if (values.city.trim().length < 2) errors.city = "Enter your city.";
  }
  if (!values.age) errors.age = `Please confirm you're ${MINIMUM_AGE} or older.`;
  return errors;
}

export const without = (errors: Errors, ...fields: Field[]): Errors => Object.fromEntries(Object.entries(errors).filter(([field]) => !fields.includes(field as Field)));

export const toOrderLine = (line: CartLine): OrderLine => ({
  productId: line.item.id,
  slug: line.item.slug,
  name: line.item.name,
  variety: line.variety?.name ?? null,
  unitPrice: lineUnitPrice(line),
  quantity: line.quantity,
  category: line.item.category,
  type: line.item.type,
  color: line.item.color,
  image_url: line.item.image_url,
});
