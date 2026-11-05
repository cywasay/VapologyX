"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createClient } from "../utils/supabase/client";

export type Account = { id: string; email: string; avatarUrl: string | null };
type Status = { kind: "error" | "success"; text: string };

const AVATAR_BUCKET = "avatars";
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const PASSWORD_MIN_LENGTH = 8;

export function Avatar({ account, size }: { account: Account | null | undefined; size: number }) {
  if (account?.avatarUrl) return <Image className="admin-avatar" src={account.avatarUrl} alt="" width={size} height={size} unoptimized />;
  return <span className="admin-avatar" style={{ width: size, height: size, fontSize: size * .42 }} aria-hidden="true">{account?.email.charAt(0).toUpperCase() ?? ""}</span>;
}

function StatusLine({ status }: { status: Status | null }) {
  return <p className={`form-status ${status ? `is-${status.kind}` : ""}`} role="status">{status?.text}</p>;
}

function PasswordInput({ id, name, label, autoComplete, minLength }: { id: string; name: string; label: string; autoComplete: string; minLength?: number }) {
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

function uploadErrorText(message: string) {
  if (/bucket not found/i.test(message)) return "Photo storage isn't set up yet. Run the setup script in Supabase first.";
  if (/row-level security|unauthorized|403/i.test(message)) return "Your account doesn't have permission to upload photos.";
  if (/size|too large/i.test(message)) return "That photo is too large. The limit is 2 MB.";
  return "The photo couldn't be uploaded. Please try again.";
}

function ProfileCard({ account, onAvatarChange }: { account: Account; onAvatarChange: (url: string) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setStatus({ kind: "error", text: "Please choose a JPG, PNG or WebP image." });
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setStatus({ kind: "error", text: "That photo is too large. The limit is 2 MB." });
      return;
    }

    setBusy(true);
    setStatus(null);
    const supabase = createClient();
    const path = `${account.id}/avatar`;
    const storage = supabase.storage.from(AVATAR_BUCKET);
    const { error: uploadError } = await storage.upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
    if (uploadError) {
      setStatus({ kind: "error", text: uploadErrorText(uploadError.message) });
      setBusy(false);
      return;
    }
    // The file keeps the same path, so a version stops browsers showing the old picture.
    const url = `${storage.getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    const { error: saveError } = await supabase.auth.updateUser({ data: { avatar_url: url } });
    setBusy(false);
    if (saveError) {
      setStatus({ kind: "error", text: "The photo uploaded but couldn't be saved to your profile. Please try again." });
      return;
    }
    onAvatarChange(url);
    setStatus({ kind: "success", text: "Profile picture updated." });
  }

  return <section className="admin-card settings-card" aria-labelledby="profile-title">
    <h2 id="profile-title">Profile picture</h2>
    <div className="settings-profile">
      <Avatar account={account} size={112} />
      <div>
        <strong>{account.email}</strong>
        <p>JPG, PNG or WebP, up to 2 MB.</p>
        <input ref={fileInput} className="sr-only" type="file" accept={AVATAR_TYPES.join(",")} tabIndex={-1} aria-label="Choose a profile picture" onChange={upload} />
        <button className="button button-black" type="button" disabled={busy} onClick={() => fileInput.current?.click()}>{busy ? "Uploading…" : "Upload photo"}</button>
      </div>
    </div>
    <StatusLine status={status} />
  </section>;
}

function PasswordCard({ account }: { account: Account }) {
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

export function AdminSettings({ account, onAvatarChange }: { account: Account | null | undefined; onAvatarChange: (url: string) => void }) {
  if (account === undefined) return <p className="admin-note">Loading your account…</p>;
  if (account === null) return <p className="admin-note">We couldn&apos;t load your account. Please refresh the page or log in again.</p>;
  return <div className="settings-grid">
    <ProfileCard account={account} onAvatarChange={onAvatarChange} />
    <PasswordCard account={account} />
  </div>;
}
