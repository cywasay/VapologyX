import { Select } from "@/components/dropdown";

export type ChoiceOption = { value: string; label: string };

// A row of buttons to pick one value, or a drop-down when there are many.
export function ShelfChoice({ label, options, value, onChange }: { label: string; options: ChoiceOption[]; value: string; onChange: (value: string) => void }) {
  if (options.length > 8) {
    return <label className="shelf-control">{label}<Select variant="pill" value={value} options={options} onChange={onChange} /></label>;
  }
  return <div className="tabs" role="group" aria-label={label}>
    {options.map(option => <button key={option.value} type="button" className={value === option.value ? "is-active" : ""} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
  </div>;
}
