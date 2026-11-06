"use client";

import { useState, type RefObject } from "react";
import { createClient } from "@/utils/supabase/client";

export function LogoutDialog({ dialog }: { dialog: RefObject<HTMLDialogElement | null> }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function logOut() {
    setLoggingOut(true);
    setError("");
    const { error: signOutError } = await createClient().auth.signOut();
    if (signOutError) {
      setLoggingOut(false);
      setError("We couldn't log you out. Please try again.");
      return;
    }
    window.location.replace("/admin/login");
  }

  return <dialog ref={dialog} className="confirm-dialog" aria-labelledby="logout-title" aria-describedby="logout-text" onClick={event => { if (event.target === event.currentTarget && !loggingOut) dialog.current?.close(); }}>
    <div className="confirm-inner">
      <h2 id="logout-title">Log out?</h2>
      <p id="logout-text">You&apos;ll need to log in again to manage the shop.</p>
      <p className="form-status is-error" role="alert">{error}</p>
      <div className="confirm-actions">
        <button className="button button-outline" autoFocus disabled={loggingOut} onClick={() => dialog.current?.close()}>Cancel</button>
        <button className="button button-danger" disabled={loggingOut} onClick={logOut}>{loggingOut ? "Logging out…" : "Log out"}</button>
      </div>
    </div>
  </dialog>;
}
