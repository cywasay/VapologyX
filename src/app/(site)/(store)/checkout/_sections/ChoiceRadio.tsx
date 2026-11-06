// One big radio choice: a title, a short note and an optional price on the right.
export function ChoiceRadio({ name, value, selected, onSelect, title, note, aside }: { name: string; value: string; selected: boolean; onSelect: () => void; title: string; note?: string; aside?: string }) {
  return <label className={`choice ${selected ? "is-selected" : ""}`}>
    <input type="radio" name={name} value={value} checked={selected} onChange={onSelect} />
    <span className="choice-dot" aria-hidden="true" />
    <span className="choice-text"><strong>{title}</strong>{note && <small>{note}</small>}</span>
    {aside && <b className="choice-aside">{aside}</b>}
  </label>;
}
