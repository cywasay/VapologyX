import type { Errors, SetValue, Values } from "./checkoutDraft";
import { TextField } from "./TextField";

export function DetailsCard({ values, errors, set }: { values: Values; errors: Errors; set: SetValue }) {
  return <section className="panel-light checkout-card" aria-labelledby="checkout-contact">
    <h2 id="checkout-contact">Your details</h2>
    <div className="checkout-pair">
      <TextField id="name" label="Full name" value={values.name} error={errors.name} autoComplete="name" onValue={value => set("name", value)} />
      <TextField id="phone" label="Mobile number" value={values.phone} error={errors.phone} hint="We message you on this number to confirm your order." type="tel" inputMode="tel" autoComplete="tel" onValue={value => set("phone", value)} />
    </div>
    <TextField id="email" label="Email" optional value={values.email} error={errors.email} type="email" autoComplete="email" onValue={value => set("email", value)} />
  </section>;
}
