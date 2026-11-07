// How today compares with yesterday: a small arrow and the change in percent.
export function Delta({ now, before }: { now: number; before: number }) {
  if (now === 0 && before === 0) return <span className="admin-delta keep-motion">No sales yet today</span>;
  if (before === 0) return <span className="admin-delta keep-motion is-up"><i aria-hidden="true">▲</i>New today</span>;
  const change = Math.round(((now - before) / before) * 100);
  if (change === 0) return <span className="admin-delta keep-motion">Same as yesterday</span>;
  return <span className={`keep-motion admin-delta ${change > 0 ? "is-up" : "is-down"}`}><i aria-hidden="true">{change > 0 ? "▲" : "▼"}</i>{Math.abs(change)}% vs yesterday</span>;
}
