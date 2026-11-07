import { StoreDetails } from "@/components/StoreDetails";
import { CITIES, DELIVERY_FEE, type DeliveryMethod } from "@/lib/orders";
import { money } from "@/lib/products";
import { ChoiceRadio } from "./ChoiceRadio";
import type { Errors, SetValue, Values } from "./checkoutDraft";
import { TextField } from "./TextField";

export function DeliveryCard({ values, errors, set, deliveryFree, onMethod }: { values: Values; errors: Errors; set: SetValue; deliveryFree: boolean; onMethod: (method: DeliveryMethod) => void }) {
  const pickup = values.method === "pickup";
  return <section className="panel-light checkout-card" aria-labelledby="checkout-delivery">
    <h2 id="checkout-delivery">Delivery</h2>
    <fieldset className="choice-group">
      <legend className="sr-only">How would you like to get your order?</legend>
      <ChoiceRadio name="method" value="delivery" selected={!pickup} onSelect={() => onMethod("delivery")} title="Home delivery" note="We bring it to your door." aside={deliveryFree ? "Free" : money(DELIVERY_FEE)} />
      <ChoiceRadio name="method" value="pickup" selected={pickup} onSelect={() => onMethod("pickup")} title="Store pickup" note="Collect it from the store when it's ready." aside="Free" />
    </fieldset>
    {pickup
      ? <div className="checkout-pickup"><strong>Collect your order here</strong><StoreDetails /></div>
      : <>
        <TextField id="address" label="Address" value={values.address} error={errors.address} hint="House or flat number, street and area." autoComplete="street-address" onValue={value => set("address", value)} />
        <TextField id="city" label="City" value={values.city} error={errors.city} suggestions={[...CITIES]} onValue={value => set("city", value)} />
      </>}
    <div className="field field-optional">
      <label htmlFor="checkout-notes">{pickup ? "Note for the store" : "Delivery note"}<span> (optional)</span></label>
      <textarea id="checkout-notes" name="notes" rows={3} maxLength={300} value={values.notes} onChange={event => set("notes", event.target.value)} />
    </div>
  </section>;
}
