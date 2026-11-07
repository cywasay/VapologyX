"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { EmptyState } from "../../_shared/EmptyState";
import { ADMIN_PAGE_SIZE, Pager } from "../../_shared/Pager";
import { Pills } from "../../_shared/Pills";
import { useNotifications } from "../_data/Notifications";

type Thread = { email: string; name: string; last: string; lastAt: string; total: number; unread: number };
type Page = { total: number; items: Thread[] };
type Message = { id: string; name: string; message: string; created_at: string; read_at: string | null };

const filters = [{ value: "all", label: "All" }, { value: "unread", label: "Unread" }];
const clock = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
// Today shows the time, anything older shows the date.
const short = (iso: string) => {
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString() ? date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
const initial = (name: string) => name.trim().slice(0, 1).toUpperCase() || "?";

// The shop's inbox. Every email that has written in is one conversation; follow-ups join the same one.
// The open conversation lives in the page address (?c=email), so the bell can link straight to it.
export function MessagesView() {
  const params = useSearchParams();
  const open = params.get("c");
  const { refresh, arrivals, watching } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [list, setList] = useState<Page | null>(null);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);

  const choose = useCallback((email: string | null) => {
    const url = new URL(window.location.href);
    if (email) url.searchParams.set("c", email); else url.searchParams.delete("c");
    window.history.replaceState(null, "", url);
    setVersion(current => current + 1);
  }, []);

  useEffect(() => {
    let stale = false;
    Promise.resolve(createClient().rpc("message_threads", { p_offset: page * ADMIN_PAGE_SIZE, p_limit: ADMIN_PAGE_SIZE, p_unread_only: filter === "unread" })).then(({ data, error }) => {
      if (stale) return;
      if (error || !data) return setFailed(true);
      setFailed(false);
      setList(data as Page);
    });
    return () => { stale = true; };
  }, [page, filter, version, arrivals]);

  useEffect(() => { watching(open); return () => watching(null); }, [open, watching]);

  const unreadTotal = list?.items.reduce((sum, item) => sum + item.unread, 0) ?? 0;

  return <>
    <h1 className="admin-title is-small">Messages</h1>
    {failed && <p className="form-status is-error" role="alert">We couldn&apos;t load the messages. Please refresh the page.</p>}
    {!failed && !list && <p className="admin-caption">Loading…</p>}
    {list && list.total === 0 && filter === "all" && !open && <EmptyState icon="messages" title="No messages yet">Messages sent from the Contact page will appear here, and you&apos;ll get a notification the moment one arrives.</EmptyState>}
    {list && (list.total > 0 || filter !== "all" || open) && <div className={`inbox ${open ? "has-open" : ""}`}>
      <section className="inbox-list" aria-label="Conversations">
        <Pills label="Filter conversations" options={filters} value={filter} onChange={next => { setFilter(next); setPage(0); }} count={option => option === "unread" ? unreadTotal : list.total} />
        {list.items.length === 0
          ? <p className="inbox-none">{filter === "unread" ? "No unread messages. Nice." : "Nothing here yet."}</p>
          : <ul>{list.items.map(item => <li key={item.email}>
            <button className={`thread ${open === item.email ? "is-open" : ""} ${item.unread ? "is-unread" : ""}`} aria-current={open === item.email ? "true" : undefined} onClick={() => choose(item.email)}>
              <span className="thread-avatar" aria-hidden="true">{initial(item.name)}</span>
              <span className="thread-text">
                <span className="thread-top"><strong>{item.name}</strong><time dateTime={item.lastAt}>{short(item.lastAt)}</time></span>
                <span className="thread-last">{item.last}</span>
              </span>
              {item.unread > 0 && <b className="thread-badge" aria-label={`${item.unread} unread`}>{item.unread}</b>}
            </button>
          </li>)}</ul>}
        <Pager page={page} shown={list.items.length} total={list.total} onPage={setPage} />
      </section>
      <section className="inbox-view" aria-label="Conversation">
        {open ? <Conversation key={open} email={open} onClose={() => choose(null)} onChanged={() => { setVersion(current => current + 1); refresh(); }} />
          : <div className="inbox-pick"><EmptyState icon="messages" title="Pick a conversation">Choose one on the left to read it in full.</EmptyState></div>}
      </section>
    </div>}
  </>;
}

// One conversation: everything this email has sent, oldest first, each message in full.
function Conversation({ email, onClose, onChanged }: { email: string; onClose: () => void; onChanged: () => void }) {
  const { arrivals } = useNotifications();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let stale = false;
    const supabase = createClient();
    Promise.resolve(supabase.from("contact_messages").select("id,name,message,created_at,read_at").eq("email", email).order("created_at")).then(async ({ data }) => {
      if (stale) return;
      const rows = (data as Message[] | null) ?? [];
      setMessages(rows);
      // Opening a conversation marks it read.
      if (rows.some(row => !row.read_at)) {
        await supabase.rpc("message_thread_read", { p_email: email, p_read: true });
        if (!stale) onChanged();
      }
    });
    return () => { stale = true; };
    // onChanged is recreated by the parent on every render; only a new arrival or a different conversation should reload this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, arrivals]);

  async function markUnread() {
    const { error } = await createClient().rpc("message_thread_read", { p_email: email, p_read: false });
    if (error) return setProblem("That didn't work. Please try again.");
    onChanged();
    onClose();
  }

  async function remove() {
    const { error } = await createClient().rpc("message_thread_delete", { p_email: email });
    if (error) return setProblem("That didn't work. Please try again.");
    onChanged();
    onClose();
  }

  const name = messages?.at(-1)?.name ?? email;
  return <article className="convo">
    <header className="convo-head">
      <button className="convo-back" onClick={onClose} aria-label="Back to all conversations">‹</button>
      <span className="thread-avatar is-large" aria-hidden="true">{initial(name)}</span>
      <div className="convo-who"><h2>{name}</h2><a href={`mailto:${email}`}>{email}</a></div>
      <div className="convo-actions">
        <a className="button button-black" href={`mailto:${email}?subject=${encodeURIComponent("Re: your message to VapologyX")}`}>Reply by email</a>
        <button className="button button-outline" onClick={markUnread}>Mark unread</button>
        {confirming
          ? <><button className="button button-black" onClick={remove}>Yes, delete</button><button className="button button-outline" onClick={() => setConfirming(false)}>Cancel</button></>
          : <button className="button button-outline" onClick={() => setConfirming(true)}>Delete</button>}
      </div>
    </header>
    {problem && <p className="form-status is-error" role="alert">{problem}</p>}
    {!messages && <p className="admin-caption">Loading…</p>}
    {messages && <ol className="convo-log" aria-label={`Messages from ${name}`}>
      {messages.map((row, index) => <li key={row.id}>
        {(index === 0 || new Date(row.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString()) && <p className="convo-day">{new Date(row.created_at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>}
        <div className="bubble"><p>{row.message}</p><time dateTime={row.created_at}>{index > 0 && "Follow-up · "}{clock(row.created_at)}</time></div>
      </li>)}
    </ol>}
  </article>;
}
