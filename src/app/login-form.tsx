"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { BottleArt, DeviceArt, Wordmark } from "./art";
import { RED, WHITE, YELLOW } from "./products";
import { createClient } from "../utils/supabase/client";

type Status = { kind: "error" | "info"; text: string };

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const registering = mode === "register";

  function switchMode(next: "login" | "register") {
    setMode(next);
    setStatus(null);
  }

  async function register(form: HTMLFormElement, email: string, password: string, name: string) {
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus({ kind: "error", text: error.message });
      return;
    }
    form.reset();
    if (data.session) window.location.replace("/");
    else setStatus({ kind: "info", text: "Check your email to confirm your account." });
  }

  async function logIn(form: HTMLFormElement, email: string, password: string) {
    const { data, error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      const text = error.code === "invalid_credentials" ? "That email or password is incorrect."
        : error.code === "email_not_confirmed" ? "Please confirm your email first."
        : "We couldn't log you in. Please try again.";
      setStatus({ kind: "error", text });
      return;
    }
    form.reset();
    // A full page load so the server sees the new login straight away.
    window.location.replace(data.user.app_metadata.role === "admin" ? "/admin" : "/");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const email = String(fields.get("email"));
    const password = String(fields.get("password"));
    setBusy(true);
    setStatus(null);
    setShowPassword(false);
    if (registering) await register(form, email, password, String(fields.get("name")));
    else await logIn(form, email, password);
    setBusy(false);
  }

  return <main className="auth">
    <div className="tile auth-side">
      <Link href="/" aria-label="Back to the store"><Wordmark /></Link>
      <h1>{registering ? "Create your account." : "Welcome back."}</h1>
      <div className="auth-art" aria-hidden="true">
        <div className="hero-item-side"><DeviceArt kind="pod" color={WHITE} /></div>
        <div className="hero-item-main"><DeviceArt kind="box" color={YELLOW} /></div>
        <div className="hero-item-side"><BottleArt color={RED} /></div>
      </div>
    </div>
    <div className="auth-main">
      <form className="panel-light form-panel auth-form" onSubmit={submit}>
        <div className="auth-switch" role="group" aria-label="Choose log in or register">
          <button type="button" className={registering ? "" : "is-active"} aria-pressed={!registering} onClick={() => switchMode("login")}>Log in</button>
          <button type="button" className={registering ? "is-active" : ""} aria-pressed={registering} onClick={() => switchMode("register")}>Register</button>
        </div>
        {registering && <label className="field">Name<input name="name" autoComplete="name" required /></label>}
        <label className="field">Email<input name="email" type="email" autoComplete="email" required /></label>
        <div className="field">
          <label htmlFor="auth-password">Password</label>
          <div className="password-field">
            <input id="auth-password" name="password" type={showPassword ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} minLength={registering ? 8 : undefined} required />
            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
                {showPassword && <path d="m4 4 16 16" />}
              </svg>
            </button>
          </div>
        </div>
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Please wait…" : registering ? "Create account" : "Log in"}</button>
        <p className={`form-status ${status?.kind === "error" ? "is-error" : ""}`} role="status">{status?.text}</p>
        <Link className="text-link" href="/">Back to the store</Link>
      </form>
    </div>
  </main>;
}
