"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { EmptyState } from "../../_shared/EmptyState";
import { ADMIN_PAGE_SIZE, Pager } from "../../_shared/Pager";

type Message = { id: string; name: string; email: string; message: string; created_at: string; read_at: string | null };

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

// Messages sent from the shop's Contact page, newest first. Opening one marks it read.
export function MessagesView() {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Message[] | null>(null);
  const [total, setTotal] = useState(0);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let stale = false;
    Promise.resolve(createClient().from("contact_messages").select("id,name,email,message,created_at,read_at", { count: "exact" }).order("created_at", { ascending: false }).range(page * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE + ADMIN_PAGE_SIZE - 1)).then(({ data, count, error }) => {
      if (stale) return;
      if (error) return setFailed(true);
      setFailed(false);
      setRows(data as Message[]);
      setTotal(count ?? 0);
    });
    return () => { stale = true; };
  }, [page, version]);

  const toggle = useCallback(async (message: Message) => {
    setOpen(current => current === message.id ? null : message.id);
    if (message.read_at) return;
    const readAt = new Date().toISOString();
    setRows(current => current && current.map(row => row.id === message.id ? { ...row, read_at: readAt } : row));
    await createClient().from("contact_messages").update({ read_at: readAt }).eq("id", message.id);
  }, []);

  async function remove(message: Message) {
    const { error } = await createClient().from("contact_messages").delete().eq("id", message.id);
    if (error) return setFailed(true);
    setOpen(null);
    setVersion(current => current + 1);
  }

  return <>
    <h1 className="admin-title is-small">Messages</h1>
    {failed && <p className="form-status is-error" role="alert">We couldn&apos;t load the messages. Please refresh the page.</p>}
    {!failed && !rows && <p className="admin-caption">Loading…</p>}
    {rows && rows.length === 0 && <EmptyState icon="messages" title="No messages yet">Messages sent from the Contact page will appear here.</EmptyState>}
    {rows && rows.length > 0 && <>
      <ul className="msg-list">
        {rows.map(row => <li key={row.id} className={`msg ${row.read_at ? "" : "is-unread"}`}>
          <button className="msg-head" aria-expanded={open === row.id} onClick={() => toggle(row)}>
            <span className="msg-who"><strong>{row.name}</strong><small>{row.email}</small></span>
            <span className="msg-when">{!row.read_at && <i className="msg-dot" aria-label="Unread" />}{when(row.created_at)}</span>
          </button>
          {open === row.id
            ? <div className="msg-body"><p>{row.message}</p><div className="msg-actions"><a className="button button-black" href={`mailto:${row.email}`}>Reply by email</a><button className="button button-outline" onClick={() => remove(row)}>Delete</button></div></div>
            : <p className="msg-preview">{row.message}</p>}
        </li>)}
      </ul>
      <Pager page={page} shown={rows.length} total={total} onPage={setPage} />
    </>}
  </>;
}
