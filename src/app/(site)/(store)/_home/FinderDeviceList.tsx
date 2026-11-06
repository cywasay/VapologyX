import type { Product } from "@/lib/products";

// The buttons that pick a device in the coil finder, each with how many coils fit it.
export function FinderDeviceList({ devices, coils, selected, onChoose }: { devices: Product[]; coils: Record<string, Product[]>; selected: number; onChoose: (index: number) => void }) {
  return <div className="finder-list" role="group" aria-label="Choose your device">
    {devices.map((item, index) => {
      const count = coils[item.id]?.length ?? 0;
      return <button key={item.id} className={index === selected ? "is-current" : ""} aria-pressed={index === selected} onClick={() => onChoose(index)}>
        <i aria-hidden="true" />
        <span>{item.name}</span>
        <em>{count ? `${count} ${count === 1 ? "coil" : "coils"}` : "No coils yet"}</em>
      </button>;
    })}
  </div>;
}
