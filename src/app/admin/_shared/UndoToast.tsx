"use client";

// A short message with an Undo button. A thin bar runs down while the undo window is open, so it is clear the chance is about to end.
export function UndoToast({ message, onUndo, seconds }: { message: string; onUndo: () => void; seconds: number }) {
  return <div className="admin-toast keep-motion" role="status">
    <span>{message}</span>
    <button type="button" onClick={onUndo}>Undo</button>
    <i style={{ animationDuration: `${seconds}s` }} aria-hidden="true" />
  </div>;
}
