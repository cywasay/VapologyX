"use client";

import { useState } from "react";

export function PasswordInput({ id, name, label, autoComplete, minLength }: { id: string; name: string; label: string; autoComplete: string; minLength?: number }) {
  const [visible, setVisible] = useState(false);
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <div className="password-field">
      <input id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} required />
      <button type="button" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="m4 4 16 16" />}
        </svg>
      </button>
    </div>
  </div>;
}
