"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useStore } from "@/components/store/store-context";
import { lineUnitPrice, type CartLine } from "@/lib/cart-store";
import { usePhoneLayout } from "@/lib/phone-layout";
import { FREE_DELIVERY_FROM, isStockProblem, normalizePhone, orderTotals, placeOrder, type DeliveryMethod } from "@/lib/orders";
import { CheckoutSummary } from "./CheckoutSummary";
import { DRAFT_KEY, FIELD_ORDER, readDraft, toOrderLine, validate, without, type Errors, type Field, type SetValue, type Values } from "./checkoutDraft";
import { ConfirmCard } from "./ConfirmCard";
import { DeliveryCard } from "./DeliveryCard";
import { DetailsCard } from "./DetailsCard";
import { PaymentCard } from "./PaymentCard";

const PHONE_FIELD_ORDER: Field[] = ["address", "city", "name", "phone", "email", "age"];

// The checkout form. It remembers the details in this browser and places the order when it is sent.
export function CheckoutForm({ lines, locked, onPlaced }: { lines: CartLine[]; locked: boolean; onPlaced: (lines: CartLine[]) => void }) {
  const router = useRouter();
  const { clear } = useStore();
  const phone = usePhoneLayout();
  const [values, setValues] = useState<Values>(readDraft);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  // Set the moment the button is pressed, so a double click can't place the order twice before the page redraws.
  const sending = useRef(false);
  const subtotal = lines.reduce((sum, line) => sum + lineUnitPrice(line) * line.quantity, 0);
  const totals = orderTotals(subtotal, values.method);
  const deliveryFree = subtotal >= FREE_DELIVERY_FROM;
  const pickup = values.method === "pickup";

  useEffect(() => {
    const { name, phone, email, address, city, method, payment } = values;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, phone, email, address, city, method, payment }));
    } catch {}
  }, [values]);

  const set: SetValue = (key, value) => {
    setValues(current => ({ ...current, [key]: value }));
    setErrors(current => without(current, key as Field));
  };

  function chooseMethod(method: DeliveryMethod) {
    set("method", method);
    if (method === "pickup") setErrors(current => without(current, "address", "city"));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || busy || locked) return;
    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setFormError("Please check the highlighted fields.");
      const first = (phone ? PHONE_FIELD_ORDER : FIELD_ORDER).find(field => found[field]);
      if (first) document.getElementById(`checkout-${first}`)?.focus();
      return;
    }
    sending.current = true;
    setBusy(true);
    setFormError("");
    try {
      const order = await placeOrder({
        customer: { name: values.name.trim(), phone: normalizePhone(values.phone) ?? values.phone.trim(), email: values.email.trim() },
        delivery: { method: values.method, address: pickup ? "" : values.address.trim(), city: pickup ? "" : values.city.trim(), notes: values.notes.trim() },
        payment: values.payment,
        lines: lines.map(toOrderLine),
      });
      onPlaced(lines);
      clear();
      router.push(`/order/${order.number}`);
    } catch (error) {
      setFormError(isStockProblem(error) ? "Something in your cart just sold out or changed. Please check your cart and try again." : "We couldn't place your order. Please try again.");
      sending.current = false;
      setBusy(false);
    }
  }

  const details = <DetailsCard key="contact" values={values} errors={errors} set={set} />;
  const delivery = <DeliveryCard key="delivery" values={values} errors={errors} set={set} deliveryFree={deliveryFree} onMethod={chooseMethod} />;
  const summary = <CheckoutSummary key="summary" lines={lines} subtotal={subtotal} totals={totals} pickup={pickup} deliveryFree={deliveryFree} phone={phone} />;
  const error = formError && <p className="flow-error" role="alert">{formError}</p>;

  return <form className="checkout" onSubmit={submit} noValidate>
    {!phone && error}
    {phone ? [summary, delivery, details] : [details, delivery]}
    <PaymentCard values={values} set={set} />
    {!phone && summary}
    <ConfirmCard values={values} errors={errors} set={set} pickup={pickup} total={totals.total} busy={busy || locked} submitError={phone ? error : null} />
  </form>;
}
