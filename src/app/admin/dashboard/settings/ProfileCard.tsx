"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Account } from "../../_shared/account";
import { Avatar } from "../../_shared/Avatar";
import { StatusLine, type Status } from "../../_shared/StatusLine";

const AVATAR_BUCKET = "avatars";
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function uploadErrorText(message: string) {
  if (/bucket not found/i.test(message)) return "Photo storage isn't set up yet. Run the setup script in Supabase first.";
  if (/row-level security|unauthorized|403/i.test(message)) return "Your account doesn't have permission to upload photos.";
  if (/size|too large/i.test(message)) return "That photo is too large. The limit is 2 MB.";
  return "The photo couldn't be uploaded. Please try again.";
}

export function ProfileCard({ account, onAvatarChange }: { account: Account; onAvatarChange: (url: string) => void }) {
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
