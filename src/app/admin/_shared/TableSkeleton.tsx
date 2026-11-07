// Grey rows shaped like a real table while its data loads. The headings stay, so the page doesn't jump when the rows arrive.
export function TableSkeleton({ headers, rows = 10, label }: { headers: string[]; rows?: number; label: string }) {
  return <div className="admin-table is-skeleton keep-motion" role="status" aria-label={label}>
    <table aria-hidden="true">
      <thead><tr>{headers.map((header, index) => <th key={index}>{header}</th>)}</tr></thead>
      <tbody>{Array.from({ length: rows }, (_, row) => <tr key={row}>
        {headers.map((_, column) => <td key={column}><span className="sk sk-cell" style={{ width: `${column === 0 ? 70 : 38 + ((row + column) % 3) * 14}%` }} /></td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}
