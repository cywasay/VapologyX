"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type InputHTMLAttributes, type KeyboardEvent, type RefObject } from "react";

// The one drop-down of the whole site, for the shop and the admin panel alike. It replaces the browser's own select box and
// suggestion list, which can't be styled. Two kinds: Select (pick one of a fixed list) and ComboInput (type anything, with suggestions).

export type Option = { value: string; label: string };

function Chevron() {
  return <svg className="dd-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>;
}

// The list of choices. It is drawn in the top layer, so no scrolling box or dialog can cut it off,
// and it opens below its anchor, or above when there is no room.
function List({ anchor, id, items, active, selected, onPick, onHover, onClose }: {
  anchor: RefObject<HTMLElement | null>;
  id: string;
  items: Option[];
  active: number;
  selected?: string;
  onPick: (index: number) => void;
  onHover: (index: number) => void;
  onClose: () => void;
}) {
  const list = useRef<HTMLUListElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });

  useLayoutEffect(() => {
    const el = list.current;
    const box = anchor.current;
    if (!el || !box) return;
    el.showPopover();
    const rect = box.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const placeBelow = below >= Math.min(el.scrollHeight, 240) || below >= above;
    el.style.minWidth = `${rect.width}px`;
    el.style.maxHeight = `${Math.max(120, Math.min(320, placeBelow ? below : above))}px`;
    el.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - el.offsetWidth - 8))}px`;
    el.style.top = `${placeBelow ? rect.bottom + 6 : rect.top - el.offsetHeight - 6}px`;
    const away = (event: Event) => { if (!el.contains(event.target as Node)) close.current(); };
    window.addEventListener("scroll", away, true);
    window.addEventListener("resize", away);
    return () => {
      window.removeEventListener("scroll", away, true);
      window.removeEventListener("resize", away);
      try { el.hidePopover(); } catch {}
    };
  }, [anchor]);

  useEffect(() => { list.current?.children[active]?.scrollIntoView({ block: "nearest" }); }, [active]);

  // Pressing an option must not move focus away from the field, and a click must not reach a label around the drop-down.
  return <ul ref={list} id={id} className="dd-list" role="listbox" popover="manual" onPointerDown={event => event.preventDefault()} onClick={event => event.preventDefault()}>
    {items.map((item, index) => <li key={item.value} id={`${id}-${index}`} role="option" aria-selected={item.value === selected} className={`dd-option ${index === active ? "is-active" : ""}`} onPointerMove={() => onHover(index)} onClick={() => onPick(index)}>
      <span>{item.label}</span>
      {item.value === selected && <svg className="dd-check" viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 6.5 2.5 2.5 4.5-5.5" /></svg>}
    </li>)}
  </ul>;
}

// Closes the list when a press lands anywhere outside it.
function useOutsidePress(open: boolean, wrap: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const press = (event: PointerEvent) => { if (!wrap.current?.contains(event.target as Node)) close(); };
    document.addEventListener("pointerdown", press);
    return () => document.removeEventListener("pointerdown", press);
  }, [open, wrap, close]);
}

export function Select({ value, options, onChange, variant = "field", id, disabled, "aria-label": ariaLabel }: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  // "field" looks like a form box, "pill" like the shop's filter buttons.
  variant?: "field" | "pill";
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const index = options.findIndex(option => option.value === value);
  const close = useCallback(() => setOpen(false), []);
  useOutsidePress(open, wrap, close);

  const show = () => { setActive(Math.max(index, 0)); setOpen(true); };
  function pick(position: number) {
    const option = options[position];
    if (option) onChange(option.value);
    setOpen(false);
    button.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const last = options.length - 1;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) show();
      else setActive(current => Math.max(0, Math.min(last, current + (event.key === "ArrowDown" ? 1 : -1))));
    } else if (event.key === "Home" || event.key === "End") {
      if (open) { event.preventDefault(); setActive(event.key === "Home" ? 0 : last); }
    } else if (event.key === "Enter" || event.key === " ") {
      if (open) { event.preventDefault(); pick(active); }
    } else if (event.key === "Escape") {
      if (open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== " ") {
      // Typing letters jumps to the choice that starts with them.
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + event.key.toLowerCase(), at: now };
      const from = open ? active : index;
      const order = [...options.keys()].map(position => (position + from + 1) % options.length);
      const found = order.find(position => options[position].label.toLowerCase().startsWith(typed.current.text));
      if (found !== undefined) {
        if (open) setActive(found);
        else onChange(options[found].value);
      }
    }
  }

  return <div ref={wrap} className={`dd is-${variant}`}>
    <button
      ref={button}
      id={id}
      type="button"
      className="dd-button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-activedescendant={open ? `${listId}-${active}` : undefined}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => (open ? setOpen(false) : show())}
      onKeyDown={onKeyDown}
      onKeyUp={event => { if (event.key === " " && open) event.preventDefault(); }}
      onBlur={close}
    >
      <span>{options[index]?.label ?? ""}</span>
      <Chevron />
    </button>
    {open && <List anchor={button} id={listId} items={options} active={active} selected={value} onPick={pick} onHover={setActive} onClose={close} />}
  </div>;
}

// A text box that suggests values as you type, like the browser's own suggestion list but styled. Anything can still be typed.
export function ComboInput({ suggestions, value, onValue, ...input }: { suggestions: string[]; value: string; onValue: (value: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "list">) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsidePress(open, wrap, close);

  const typedText = value.trim().toLowerCase();
  const items = suggestions.filter(item => item.toLowerCase().includes(typedText) && item.toLowerCase() !== typedText).map(item => ({ value: item, label: item }));
  const showing = open && items.length > 0;

  function pick(position: number) {
    const item = items[position];
    if (item) onValue(item.value);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (items.length === 0) return;
      event.preventDefault();
      if (!showing) { setOpen(true); setActive(event.key === "ArrowDown" ? 0 : items.length - 1); }
      else setActive(current => (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length);
    } else if (event.key === "Enter") {
      if (showing && active >= 0) { event.preventDefault(); pick(active); }
    } else if (event.key === "Escape") {
      if (showing) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    }
  }

  return <div ref={wrap} className="dd is-combo">
    <input
      {...input}
      ref={field}
      value={value}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={showing}
      aria-controls={showing ? listId : undefined}
      aria-activedescendant={showing && active >= 0 ? `${listId}-${active}` : undefined}
      autoComplete="off"
      onChange={event => { onValue(event.target.value); setActive(-1); setOpen(true); }}
      onClick={() => setOpen(true)}
      onKeyDown={onKeyDown}
      onBlur={close}
    />
    {showing && <List anchor={field} id={listId} items={items} active={active} onPick={pick} onHover={setActive} onClose={close} />}
  </div>;
}
