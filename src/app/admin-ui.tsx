const icons = {
  overview: "M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z",
  orders: "M4 8l8-4 8 4v8l-8 4-8-4ZM4 8l8 4 8-4M12 12v8",
  products: "M4 4h7v7H4ZM13 4h7v7h-7ZM4 13h7v7H4ZM13 13h7v7h-7Z",
  customers: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5c1.9.8 3 2.8 3 5.5",
  messages: "M4 5h16v11H9l-5 4Z",
  settings: "M4 7h9M18 7h2M4 17h2M11 17h9M15.5 4.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM8.5 14.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z",
  store: "M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9c0 4 5.3 4 5.3 0 0 4 5.4 4 5.4 0 0 4 5.3 4 5.3 0M10 20v-5h4v5",
  logout: "M10 4H5v16h5M15 8l4 4-4 4M9 12h10",
  chevron: "m14 6-6 6 6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "m6 6 12 12M18 6 6 18",
  arrow: "M7 17 17 7M9 7h8v8",
  revenue: "M4 17l5-5 4 4 7-8M15 8h5v5",
  spark: "M12 4l1.8 6.2L20 12l-6.2 1.8L12 20l-1.8-6.2L4 12l6.2-1.8Z",
  plus: "M12 5v14M5 12h14",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-5-5",
  edit: "M4 20h4L19 9l-4-4L4 16ZM13.5 6.5l4 4",
};

export function Icon({ name }: { name: keyof typeof icons }) {
  return <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={icons[name]} /></svg>;
}

export function Pills({ label, options, value, onChange, count }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (option: string) => void; count: (option: string) => number | string }) {
  return <div className="admin-pills" role="group" aria-label={label}>
    {options.map(option => <button key={option.value} className={value === option.value ? "is-active" : ""} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label} <span>{count(option.value)}</span></button>)}
  </div>;
}
