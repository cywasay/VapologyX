import type { RefObject } from "react";

export function DeleteProductDialog({ dialog, name, busy, onDelete }: { dialog: RefObject<HTMLDialogElement | null>; name: string; busy: boolean; onDelete: () => void }) {
  return <dialog ref={dialog} className="confirm-dialog" aria-labelledby="delete-title" aria-describedby="delete-text" onClick={event => { if (event.target === event.currentTarget && !busy) dialog.current?.close(); }}>
    <div className="confirm-inner">
      <h2 id="delete-title">Delete this product?</h2>
      <p id="delete-text">{name} will be removed from the shop for good. This can&apos;t be undone.</p>
      <div className="confirm-actions">
        <button className="button button-outline" autoFocus disabled={busy} onClick={() => dialog.current?.close()}>Cancel</button>
        <button className="button button-danger" disabled={busy} onClick={onDelete}>{busy ? "Deleting…" : "Delete"}</button>
      </div>
    </div>
  </dialog>;
}
