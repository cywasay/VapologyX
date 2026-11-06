"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { StatusLine, type Status } from "../_shared/StatusLine";

// The form is ready, but sending the reset email is switched on later, together with the customer reset flow.
export function AdminForgotForm() {
  const [status, setStatus] = useState<Status | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "info", text: "Password reset by email isn't switched on yet. Please ask the shop owner to reset your password." });
  }

  return <form className="panel-light form-panel auth-form" onSubmit={submit}>
    <h2>Reset your password</h2>
    <p>Enter your admin email and we&apos;ll send you a link to choose a new password.</p>
    <label className="field">Email<input name="email" type="email" autoComplete="email" required /></label>
    <button className="button button-primary" type="submit">Send reset link</button>
    <StatusLine status={status} />
    <Link className="text-link" href="/admin/login">Back to log in</Link>
  </form>;
}
