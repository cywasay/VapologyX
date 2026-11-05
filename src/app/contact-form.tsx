"use client";

import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [status, setStatus] = useState("");

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setStatus("This is a demo, so your message was not sent or saved.");
  }

  return <form className="panel-light form-panel" onSubmit={send}>
    <h2>Send a message</h2>
    <label className="field">Name<input name="name" autoComplete="name" required /></label>
    <label className="field">Email<input name="email" type="email" autoComplete="email" required /></label>
    <label className="field">Message<textarea name="message" rows={5} required /></label>
    <button className="button button-primary" type="submit">Send message</button>
    <p className="form-status" role="status">{status}</p>
  </form>;
}
