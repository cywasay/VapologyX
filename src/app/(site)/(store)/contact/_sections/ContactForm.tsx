"use client";

import { useState, type FormEvent } from "react";
import { publicClient } from "@/utils/supabase/public";

// Saves the message in the database, where it shows up under Messages in the admin panel.
export function ContactForm() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    // A hidden box real visitors never see. Bots fill it in, and their message is quietly dropped.
    if (String(data.get("website") ?? "") !== "") return form.reset();
    setSending(true);
    setStatus("");
    const { data: result, error } = await publicClient().rpc("send_contact_message", { p_name: String(data.get("name")), p_email: String(data.get("email")), p_message: String(data.get("message")) });
    setSending(false);
    if (error || result === "busy") return setStatus("We couldn't send your message just now. Please try again in a little while.");
    if (result !== "ok") return setStatus("Please check your name, email and message, then try again.");
    form.reset();
    setStatus("Thank you. Your message has been sent and we'll reply by email.");
  }

  return <form className="panel-light form-panel" onSubmit={send}>
    <h2>Send a message</h2>
    <label className="field">Name<input name="name" autoComplete="name" maxLength={120} required /></label>
    <label className="field">Email<input name="email" type="email" autoComplete="email" maxLength={200} required /></label>
    <label className="field">Message<textarea name="message" rows={5} maxLength={2000} required /></label>
    <input className="sr-only" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <button className="button button-primary" type="submit" disabled={sending}>{sending ? "Sending…" : "Send message"}</button>
    <p className="form-status" role="status">{status}</p>
  </form>;
}
