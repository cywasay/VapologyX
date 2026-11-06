import { PAGE_SIZE } from "./useProductList";

export function ProductsPager({ page, shown, total, onPage }: { page: number; shown: number; total: number; onPage: (page: number) => void }) {
  const first = page * PAGE_SIZE + 1;
  const last = page * PAGE_SIZE + shown;
  return <div className="admin-pager">
    <span>Showing {first}–{last} of {total}</span>
    <div>
      <button className="button button-white" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button>
      <button className="button button-white" disabled={last >= total} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  </div>;
}
