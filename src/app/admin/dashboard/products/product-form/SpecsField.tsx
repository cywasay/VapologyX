import type { Spec } from "@/lib/products";
import { Icon } from "../../../_shared/Icon";

export function SpecsField({ specs, onChange }: { specs: Spec[]; onChange: (specs: Spec[]) => void }) {
  const edit = (index: number, patch: Partial<Spec>) => onChange(specs.map((other, i) => i === index ? { ...other, ...patch } : other));
  return <fieldset className="product-form-group">
    <legend>Specs</legend>
    <p>The first three appear as big numbers on the product page. Empty rows are skipped.</p>
    {specs.map((spec, index) => <div key={index} className="product-form-pair">
      <input aria-label={`Spec ${index + 1} name`} placeholder="Name" value={spec.label} onChange={event => edit(index, { label: event.target.value })} />
      <input aria-label={`Spec ${index + 1} value`} placeholder="Value" value={spec.value} onChange={event => edit(index, { value: event.target.value })} />
      <button type="button" className="product-form-remove" aria-label={`Remove spec ${index + 1}`} onClick={() => onChange(specs.filter((_, i) => i !== index))}>×</button>
    </div>)}
    <button type="button" className="product-form-add" onClick={() => onChange([...specs, { label: "", value: "" }])}><Icon name="plus" />Add spec</button>
  </fieldset>;
}
