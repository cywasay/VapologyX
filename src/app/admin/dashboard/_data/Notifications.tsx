"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

export type Incoming = { id: string; name: string; email: string; message: string; created_at: string };
type State = {
  unread: number;
  // Goes up by one for every message that arrives, so a page showing messages knows to reload.
  arrivals: number;
  recent: Incoming[];
  toast: Incoming | null;
  dismissToast: () => void;
  // Called by the Messages page when it marks things read, so the bell and the count stay right.
  refresh: () => void;
  // The conversation the Messages page has open right now. A new message in it doesn't need a toast.
  watching: (email: string | null) => void;
  alerts: "unsupported" | "default" | "granted" | "denied";
  enableAlerts: () => void;
};

const Context = createContext<State | null>(null);

// Listens for new Contact messages while the admin panel is open: keeps the bell's count and list, shows a toast, and
// (when allowed) a desktop alert for a tab that is open in the background. Nothing runs when no admin tab is open.
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [unread, setUnread] = useState(0);
  const [arrivals, setArrivals] = useState(0);
  const [recent, setRecent] = useState<Incoming[]>([]);
  const [toast, setToast] = useState<Incoming | null>(null);
  const [alerts, setAlerts] = useState<State["alerts"]>("unsupported");
  const open = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const refresh = useCallback(() => {
    const supabase = createClient();
    Promise.resolve(supabase.from("contact_messages").select("id", { count: "exact", head: true }).is("read_at", null)).then(({ count }) => setUnread(count ?? 0));
    Promise.resolve(supabase.from("contact_messages").select("id,name,email,message,created_at").is("read_at", null).order("created_at", { ascending: false }).limit(6)).then(({ data }) => setRecent((data as Incoming[] | null) ?? []));
  }, []);

  useEffect(() => {
    refresh();
    const permission = setTimeout(() => { if (typeof Notification !== "undefined") setAlerts(Notification.permission); }, 0);
    const supabase = createClient();
    const channel = supabase.channel("contact-messages").on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_messages" }, payload => {
      const message = payload.new as Incoming;
      refresh();
      setArrivals(count => count + 1);
      if (open.current === message.email) return;
      setToast(message);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), 9000);
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
        try { new Notification(`New message from ${message.name}`, { body: message.message.slice(0, 120), tag: message.id }); } catch { /* some browsers only allow this from a service worker */ }
      }
    }).subscribe();
    return () => { clearTimeout(permission); clearTimeout(timer.current); void supabase.removeChannel(channel); };
  }, [refresh]);

  const value = useMemo<State>(() => ({
    unread, arrivals, recent, toast, alerts, refresh,
    dismissToast: () => { clearTimeout(timer.current); setToast(null); },
    watching: email => { open.current = email; },
    enableAlerts: () => { if (typeof Notification !== "undefined") void Notification.requestPermission().then(setAlerts); },
  }), [unread, arrivals, recent, toast, alerts, refresh]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useNotifications() {
  const value = useContext(Context);
  if (!value) throw new Error("useNotifications must be used inside the dashboard");
  return value;
}
