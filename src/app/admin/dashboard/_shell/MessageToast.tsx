"use client";

import Link from "next/link";
import { useNotifications } from "../_data/Notifications";
import { threadHref } from "./NotificationBell";

// Pops up when a message arrives while the admin panel is open. Opens the conversation in one tap.
export function MessageToast() {
  const { toast, dismissToast } = useNotifications();
  if (!toast) return null;
  return <div className="msg-toast keep-motion" role="status" key={toast.id}>
    <span className="bell-avatar" aria-hidden="true">{toast.name.slice(0, 1).toUpperCase()}</span>
    <span className="bell-text"><strong>New message from {toast.name}</strong><small>{toast.message}</small></span>
    <Link href={threadHref(toast.email)} onClick={dismissToast}>Open</Link>
    <button type="button" aria-label="Dismiss" onClick={dismissToast}>×</button>
  </div>;
}
