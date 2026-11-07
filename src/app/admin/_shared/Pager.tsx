// Every admin table shows this many rows at a time, so a page loads quickly however long the list grows.
export const ADMIN_PAGE_SIZE = 10;

// "Showing 1–10 of 60", then Previous, "Page 1 of 6" and Next.
export function Pager({ page, pageSize = ADMIN_PAGE_SIZE, shown, total, onPage }: { page: number; pageSize?: number; shown: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = shown === 0 ? 0 : page * pageSize + 1;
  const last = page * pageSize + shown;
  // A list that fits on one page needs no buttons.
  if (total <= pageSize) return <div className="admin-pager"><span>Showing {first}–{last} of {total}</span></div>;
  return <nav className="admin-pager" aria-label="Pages">
    <span>Showing {first}–{last} of {total}</span>
    <div>
      <button className="button button-white" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="admin-pager-page" aria-current="page">Page {page + 1} of {pages}</span>
      <button className="button button-white" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  </nav>;
}
