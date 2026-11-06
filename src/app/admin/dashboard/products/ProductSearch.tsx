import { Icon } from "../../_shared/Icon";

export function ProductSearch({ value, onChange }: { value: string; onChange: (text: string) => void }) {
  return <label className="admin-search">
    <Icon name="search" />
    <span className="sr-only">Search products by name</span>
    <input type="search" placeholder="Search products by name" value={value} onChange={event => onChange(event.target.value)} />
  </label>;
}
