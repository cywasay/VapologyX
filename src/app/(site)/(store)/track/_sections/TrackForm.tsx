import type { FormEvent } from "react";

export type TrackErrors = { number?: string; phone?: string };

// The two boxes of the track page: order number and the mobile number it was placed with.
export function TrackForm({ number, phone, errors, looking, onNumber, onPhone, onSubmit }: {
  number: string;
  phone: string;
  errors: TrackErrors;
  looking: boolean;
  onNumber: (value: string) => void;
  onPhone: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return <form className="panel-light checkout-card track-form" onSubmit={onSubmit} noValidate>
    <div className="field">
      <label htmlFor="track-number">Order number</label>
      <input id="track-number" name="number" value={number} autoCapitalize="characters" autoComplete="off" aria-invalid={errors.number ? true : undefined} aria-describedby={errors.number ? "track-number-error" : undefined} onChange={event => onNumber(event.target.value.toUpperCase())} />
      {errors.number && <span className="field-error" id="track-number-error">{errors.number}</span>}
    </div>
    <div className="field">
      <label htmlFor="track-phone">Mobile number</label>
      <input id="track-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} aria-invalid={errors.phone ? true : undefined} aria-describedby={errors.phone ? "track-phone-error" : undefined} onChange={event => onPhone(event.target.value)} />
      {errors.phone && <span className="field-error" id="track-phone-error">{errors.phone}</span>}
    </div>
    <button className="button button-primary" type="submit" disabled={looking}>{looking ? "Looking…" : "Track order"}</button>
  </form>;
}
