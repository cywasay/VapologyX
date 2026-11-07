"use client";

import { useEffect, useState, type FormEvent } from "react";
import { publicClient } from "@/utils/supabase/public";

const KEY = "vx-contact";
type Sender = { name: string; email: string };

// Remembers who sent a message for this visit only, so a follow-up lands in the same conversation without typing the details again.
const remembered = (): Sender | null => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    return saved?.name && saved?.email ? saved : null;
  } catch { return null; }
};

// Saves the message in the database, where it shows up under Messages in the admin panel.
// After sending, the form is replaced by a confirmation with a short follow-up box. Messages from the same email join one conversation.
export function ContactForm() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [sender, setSender] = useState<Sender | null>(null);
  const [sent, setSent] = useState(0);
  const [following, setFollowing] = useState(false);

  // Read after the page loads, so the server and the browser draw the same thing first.
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = remembered();
      if (saved) { setSender(saved); setSent(1); }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function deliver(who: Sender, message: string) {
    setSending(true);
    setStatus("");
    const { data, error } = await publicClient().rpc("send_contact_message", { p_name: who.name, p_email: who.email, p_message: message });
    setSending(false);
    if (error || data === "busy") { setStatus("We couldn't send your message just now. Please try again in a little while."); return false; }
    if (data !== "ok") { setStatus("Please check your name, email and message, then try again."); return false; }
    try { sessionStorage.setItem(KEY, JSON.stringify(who)); } catch { /* the follow-up just asks for the details again */ }
    setSender(who);
    setSent(count => count + 1);
    return true;
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    // A hidden box real visitors never see. Bots fill it in, and their message is quietly dropped.
    if (String(data.get("website") ?? "") !== "") return form.reset();
    if (await deliver({ name: String(data.get("name")).trim(), email: String(data.get("email")).trim() }, String(data.get("message")))) form.reset();
  }

  async function followUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (sender && await deliver(sender, String(new FormData(form).get("message")))) {
      form.reset();
      setFollowing(false);
    }
  }

  if (sender && sent > 0) return <section className="panel-light form-panel contact-sent" aria-live="polite">
    <span className="contact-sent-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>
    <h2>Message sent</h2>
    <p>Thank you, {sender.name.split(" ")[0]}. We&apos;ll respond to you soon by email at <strong>{sender.email}</strong>.</p>
    {following
      ? <form className="contact-follow" onSubmit={followUp}>
        <label className="field">Your follow-up<textarea name="message" rows={4} maxLength={2000} required autoFocus /></label>
        <div className="contact-follow-actions">
          <button className="button button-primary" type="submit" disabled={sending}>{sending ? "Sending…" : "Send follow-up"}</button>
          <button className="button button-outline" type="button" onClick={() => { setFollowing(false); setStatus(""); }}>Cancel</button>
        </div>
      </form>
      : <div className="contact-follow-actions">
        <button className="button button-outline" type="button" onClick={() => setFollowing(true)}>{sent > 1 ? "Send another follow-up" : "Send a follow-up"}</button>
        <button className="contact-new" type="button" onClick={() => { try { sessionStorage.removeItem(KEY); } catch { /* nothing to clear */ } setSender(null); setSent(0); }}>Not you? Start again</button>
      </div>}
    <p className="form-status" role="status">{status}</p>
  </section>;

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
