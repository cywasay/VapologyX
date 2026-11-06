import { Icon } from "../../../_shared/Icon";

export type OptionRow = { name: string; price: string };

export function OptionsField({ options, onChange }: { options: OptionRow[]; onChange: (options: OptionRow[]) => void }) {
  const edit = (index: number, patch: Partial<OptionRow>) => onChange(options.map((other, i) => i === index ? { ...other, ...patch } : other));
  return <fieldset className="product-form-group">
    <legend>Options</legend>
    <p>Add flavors, colors or sizes here. Leave the price empty to use the main price.</p>
    {options.map((option, index) => <div key={index} className="product-form-pair">
      <input aria-label={`Option ${index + 1} name`} placeholder="Name" value={option.name} onChange={event => edit(index, { name: event.target.value })} />
      <input aria-label={`Option ${index + 1} price`} type="number" inputMode="numeric" min="0" step="1" placeholder="Price (optional)" value={option.price} onChange={event => edit(index, { price: event.target.value })} />
      <button type="button" className="product-form-remove" aria-label={`Remove option ${index + 1}`} onClick={() => onChange(options.filter((_, i) => i !== index))}>×</button>
    </div>)}
    <button type="button" className="product-form-add" onClick={() => onChange([...options, { name: "", price: "" }])}><Icon name="plus" />Add option</button>
  </fieldset>;
}
