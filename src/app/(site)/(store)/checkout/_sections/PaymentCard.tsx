import { PAYMENT_METHODS, paymentNote } from "@/lib/orders";
import { ChoiceRadio } from "./ChoiceRadio";
import type { SetValue, Values } from "./checkoutDraft";

export function PaymentCard({ values, set }: { values: Values; set: SetValue }) {
  return <section className="panel-light checkout-card" aria-labelledby="checkout-payment">
    <h2 id="checkout-payment">Payment</h2>
    <fieldset className="choice-group">
      <legend className="sr-only">How would you like to pay?</legend>
      {PAYMENT_METHODS.map(method => <ChoiceRadio key={method.id} name="payment" value={method.id} selected={values.payment === method.id} onSelect={() => set("payment", method.id)} title={method.label} note={paymentNote(method.id, values.method)} />)}
    </fieldset>
  </section>;
}
