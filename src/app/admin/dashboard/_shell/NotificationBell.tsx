"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../_data/Notifications";

const ago = (iso: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h ago` : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export const threadHref = (email: string) => `/admin/dashboard/messages?c=${encodeURIComponent(email)}`;

// The bell in the top bar: how many messages are unread, the latest few, and a way to switch on desktop alerts.
export function NotificationBell() {
  const { unread, recent, alerts, enableAlerts } = useNotifications();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  return <div className="bell" ref={box}>
    <button className="bell-button" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
      <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15ZM10 21a2 2 0 0 0 4 0" /></svg>
      {unread > 0 && <b className="bell-count keep-motion">{unread > 9 ? "9+" : unread}</b>}
    </button>
    {open && <div className="bell-panel keep-motion">
      <div className="bell-head"><strong>Notifications</strong>{unread > 0 && <span>{unread} unread</span>}</div>
      {recent.length === 0
        ? <p className="bell-empty">You&apos;re all caught up.</p>
        : <ul>{recent.map(item => <li key={item.id}><Link href={threadHref(item.email)} onClick={() => setOpen(false)}>
          <span className="bell-avatar" aria-hidden="true">{item.name.slice(0, 1).toUpperCase()}</span>
          <span className="bell-text"><strong>{item.name}</strong><small>{item.message}</small></span>
          <time dateTime={item.created_at}>{ago(item.created_at)}</time>
        </Link></li>)}</ul>}
      <Link className="bell-all" href="/admin/dashboard/messages" onClick={() => setOpen(false)}>Open all messages</Link>
      {alerts === "default" && <button className="bell-alerts" onClick={enableAlerts}>Turn on desktop alerts</button>}
      {alerts === "denied" && <p className="bell-empty">Desktop alerts are blocked in this browser.</p>}
    </div>}
  </div>;
}
