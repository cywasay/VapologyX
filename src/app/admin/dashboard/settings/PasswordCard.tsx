"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Account } from "../../_shared/account";
import { PasswordInput } from "../../_shared/PasswordInput";
import { StatusLine, type Status } from "../../_shared/StatusLine";

const PASSWORD_MIN_LENGTH = 8;

export function PasswordCard({ account }: { account: Account }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const current = String(fields.get("current"));
    const next = String(fields.get("next"));
    if (next !== String(fields.get("confirm"))) {
      setStatus({ kind: "error", text: "The new passwords don't match." });
      return;
    }
    if (next === current) {
      setStatus({ kind: "error", text: "Your new password must be different from your current one." });
      return;
    }

    setBusy(true);
    setStatus(null);
    const supabase = createClient();
    // Proves it's really the owner, so an unattended session can't take over the account.
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: account.email, password: current });
    if (verifyError) {
      setStatus({ kind: "error", text: verifyError.code === "invalid_credentials" ? "Your current password is incorrect." : "We couldn't check your current password. Please try again." });
      setBusy(false);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    if (updateError) {
      const text = updateError.code === "weak_password" ? "That password is too weak. Please choose a stronger one."
        : updateError.code === "same_password" ? "Your new password must be different from your current one."
        : "Your password couldn't be changed. Please try again.";
      setStatus({ kind: "error", text });
      setBusy(false);
      return;
    }
    // Anyone else still logged in with the old password gets logged out.
    await supabase.auth.signOut({ scope: "others" });
    setBusy(false);
    setFormKey(formKey + 1);
    setStatus({ kind: "success", text: "Password changed. Other devices have been logged out." });
  }

  return <section className="admin-card settings-card" aria-labelledby="password-title">
    <h2 id="password-title">Change password</h2>
    <form key={formKey} className="settings-form" onSubmit={submit}>
      <PasswordInput id="current-password" name="current" label="Current password" autoComplete="current-password" />
      <PasswordInput id="new-password" name="next" label="New password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} />
      <PasswordInput id="confirm-password" name="confirm" label="Confirm new password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} />
      <button className="button button-black" type="submit" disabled={busy}>{busy ? "Changing…" : "Change password"}</button>
    </form>
    <StatusLine status={status} />
  </section>;
}
