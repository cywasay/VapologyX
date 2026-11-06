export function Pills({ label, options, value, onChange, count }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (option: string) => void; count: (option: string) => number | string }) {
  return <div className="admin-pills" role="group" aria-label={label}>
    {options.map(option => <button key={option.value} className={value === option.value ? "is-active" : ""} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label} <span>{count(option.value)}</span></button>)}
  </div>;
}
