"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BottleArt, DeviceArt, Wordmark } from "./art";
import { RED, WHITE, YELLOW } from "./products";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const registering = mode === "register";

  // Mock sign-in: nothing is checked or stored, it only opens the admin panel.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    router.push("/admin");
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
          <button type="button" className={registering ? "" : "is-active"} aria-pressed={!registering} onClick={() => setMode("login")}>Log in</button>
          <button type="button" className={registering ? "is-active" : ""} aria-pressed={registering} onClick={() => setMode("register")}>Register</button>
        </div>
        {registering && <label className="field">Name<input name="name" autoComplete="name" /></label>}
        <label className="field">Email<input name="email" type="email" autoComplete="email" /></label>
        <label className="field">Password<input name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} /></label>
        <button className="button button-primary" type="submit">{registering ? "Create account" : "Log in"}</button>
        <p className="form-status">Demo only: no details are needed, and nothing is checked or saved.</p>
        <Link className="text-link" href="/">Back to the store</Link>
      </form>
    </div>
  </main>;
}
