"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";
import { PasswordInput } from "../_shared/PasswordInput";
import { StatusLine, type Status } from "../_shared/StatusLine";

export function AdminLoginForm() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setStatus(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: String(fields.get("email")), password: String(fields.get("password")) });
    if (error) {
      const text = error.code === "invalid_credentials" ? "That email or password is incorrect."
        : error.code === "email_not_confirmed" ? "Please confirm your email first."
        : "We couldn't log you in. Please try again.";
      setStatus({ kind: "error", text });
      setBusy(false);
      return;
    }
    // Shop customers have accounts too, but this door is only for admins.
    if (data.user.app_metadata.role !== "admin") {
      await supabase.auth.signOut();
      setStatus({ kind: "error", text: "This account isn't an admin account." });
      setBusy(false);
      return;
    }
    // A full page load so the server sees the new login straight away.
    window.location.replace("/admin/dashboard");
  }

  return <form className="panel-light form-panel auth-form" onSubmit={submit}>
    <h2>Admin log in</h2>
    <label className="field">Email<input name="email" type="email" autoComplete="email" required /></label>
    <PasswordInput id="admin-password" name="password" label="Password" autoComplete="current-password" />
    <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Please wait…" : "Log in"}</button>
    <StatusLine status={status} />
    <Link className="text-link" href="/admin/forgot-password">Forgot your password?</Link>
    <Link className="text-link" href="/admin/register">Need an admin account?</Link>
    <Link className="text-link" href="/">Back to the store</Link>
  </form>;
}
