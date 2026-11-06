export function EmptyMeter({ cells }: { cells: number }) {
  return <div className="admin-meter" aria-hidden="true">{Array.from({ length: cells }, (_, index) => <i key={index} />)}</div>;
}
