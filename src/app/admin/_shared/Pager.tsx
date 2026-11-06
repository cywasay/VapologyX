// "Showing 1–25 of 60" with Previous and Next buttons.
export function Pager({ page, pageSize, shown, total, onPage }: { page: number; pageSize: number; shown: number; total: number; onPage: (page: number) => void }) {
  const first = page * pageSize + 1;
  const last = page * pageSize + shown;
  return <div className="admin-pager">
    <span>Showing {first}–{last} of {total}</span>
    <div>
      <button className="button button-white" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button>
      <button className="button button-white" disabled={last >= total} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  </div>;
}
