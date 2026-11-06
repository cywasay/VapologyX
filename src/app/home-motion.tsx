"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type FocusEvent, type ReactNode } from "react";
import { useAgeVerified } from "./age-gate";
import { BottleArt, CoilArt, DeviceArt, DisposableArt } from "./art";
import { LIME, type Category, type Product } from "./products";
import { ProductGrid } from "./product-lists";
import { categories } from "./site-blocks";
import { useStore } from "./store-shell";

export type ShelfCounts = Record<Category, number>;
type Phase = "waiting" | "intro" | "settled";

const PhaseContext = createContext<Phase>("settled");
const INTRO_TIME = 2800;

// Plays the home intro once, after the age check, and not again when the visitor comes back to the page.
export function HomeMotion({ children }: { children: ReactNode }) {
  const verified = useAgeVerified();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!verified || settled) return;
    const timer = setTimeout(() => setSettled(true), INTRO_TIME);
    return () => clearTimeout(timer);
  }, [verified, settled]);

  const phase: Phase = settled ? "settled" : verified ? "intro" : "waiting";
  return <PhaseContext value={phase}><div className={`home motion is-${phase}`}>{children}</div></PhaseContext>;
}

export function CountUp({ value }: { value: number }) {
  const phase = useContext(PhaseContext);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (phase !== "intro") return;
    let start: number | undefined;
    let frame = requestAnimationFrame(function tick(now) {
      start ??= now + 900;
      const progress = Math.min(1, Math.max(0, (now - start) / 1300));
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [phase, value]);

  return <>{shown}</>;
}

type Move = { active: number; previous: number | null; forward: boolean };
const moveTo = (move: Move, next: number): Move => next === move.active ? move : { active: next, previous: move.active, forward: next > move.active };

const STAGES = [
  { category: "device", name: "Devices", href: "/devices", art: <DeviceArt kind="box" color={LIME} /> },
  { category: "disposable", name: "Disposables", href: "/disposables", art: <DisposableArt color={LIME} /> },
  { category: "bottle", name: "Bottles", href: "/bottles", art: <BottleArt color={LIME} /> },
  { category: "coil", name: "Coils", href: "/coils", art: <CoilArt color={LIME} /> },
] as const;
const STAGE_TIME = 3800;

// One shape that morphs into a new form for each shelf, with the product swapping inside it.
export function HeroStage({ counts }: { counts: ShelfCounts }) {
  const verified = useAgeVerified();
  const [move, setMove] = useState<Move>({ active: 0, previous: null, forward: true });
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const running = verified && !paused && !held;
  const stage = STAGES[move.active];

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setMove(current => moveTo(current, (current.active + 1) % STAGES.length)), STAGE_TIME);
    return () => clearTimeout(timer);
  }, [running, move.active]);

  const release = (event: FocusEvent<HTMLDivElement>) => { if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false); };

  return <div className={`stage ${move.forward ? "is-moving-forward" : "is-moving-back"}`} data-shape={move.active} style={{ "--active": move.active, "--stage-time": `${STAGE_TIME}ms` } as CSSProperties}
    onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={release}>
    <div className="stage-frame" aria-hidden="true">
      <span className="stage-ring" />
      <span className="stage-shape" />
      {STAGES.map((item, index) => <div key={item.category} className={`stage-art ${index === move.active ? "is-active" : index === move.previous ? "is-leaving" : ""}`}>{item.art}</div>)}
      <span className="stage-index">0{move.active + 1}<i>/0{STAGES.length}</i></span>
    </div>
    <div className="stage-switch" role="group" aria-label="Choose a shelf to preview">
      <span className="stage-highlight" />
      {STAGES.map((item, index) => <button key={item.category} className={index === move.active ? "is-current" : ""} aria-pressed={index === move.active} onClick={() => setMove(current => moveTo(current, index))}>{item.name}</button>)}
    </div>
    <div className="stage-foot">
      <Link href={stage.href} className="stage-link"><b key={stage.category}>{counts[stage.category]} {stage.name.toLowerCase()}</b><span>Shop now <i aria-hidden="true">→</i></span></Link>
      <button className="stage-pause" onClick={() => setPaused(!paused)} aria-label={paused ? "Play the shelf preview" : "Pause the shelf preview"}>
        <svg className="stage-timer" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20" /><circle key={`${move.active}-${running}`} className={running ? "is-running" : ""} cx="22" cy="22" r="20" /></svg>
        <svg className="stage-pause-icon" viewBox="0 0 14 14" aria-hidden="true">{paused ? <path d="M3.5 1.5v11l9-5.5Z" /> : <path d="M3 1.5h3v11H3ZM8 1.5h3v11H8Z" />}</svg>
      </button>
    </div>
  </div>;
}

// Shelves sit side by side as narrow pills; the one under the pointer opens into a full panel.
export function CategoryRail({ counts }: { counts: ShelfCounts }) {
  const [open, setOpen] = useState(0);
  return <div className="rail">
    {categories.map((item, index) => <Link key={item.href} href={item.href} className={`rail-panel ${item.tone} ${index === open ? "is-open" : ""}`}
      onPointerEnter={() => setOpen(index)} onFocus={() => setOpen(index)} aria-label={`${item.name}, ${counts[item.category]} products`}>
      <span className="rail-count">{String(counts[item.category]).padStart(2, "0")}</span>
      <span className="rail-tag" aria-hidden="true">{item.name}</span>
      <span className="rail-copy" aria-hidden="true">
        <strong>{item.name}</strong>
        <span>{item.blurb}</span>
        <em>Shop {item.name.toLowerCase()} <i>→</i></em>
      </span>
      {item.art}
    </Link>)}
  </div>;
}

// Device pills with the same liquid highlight as the admin sidebar, and the coils that fit below.
export function CoilFinder({ devices, coils }: { devices: { id: string; name: string }[]; coils: Record<string, Product[]> }) {
  const { setFit } = useStore();
  const [move, setMove] = useState<Move>({ active: 0, previous: null, forward: true });
  const [moving, setMoving] = useState(false);
  const pills = useRef<HTMLDivElement>(null);
  const device = devices[move.active];
  const fitting = coils[device.id] ?? [];

  useEffect(() => {
    const wrap = pills.current;
    if (!wrap) return;
    const place = () => {
      const button = wrap.querySelectorAll("button")[move.active];
      if (!button) return;
      wrap.style.setProperty("--top", `${button.offsetTop}px`);
      wrap.style.setProperty("--left", `${button.offsetLeft}px`);
      wrap.style.setProperty("--right", `${wrap.clientWidth - button.offsetLeft - button.offsetWidth}px`);
      wrap.style.setProperty("--bottom", `${wrap.clientHeight - button.offsetTop - button.offsetHeight}px`);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [move.active]);

  function choose(index: number) {
    setMoving(true);
    setMove(current => moveTo(current, index));
  }

  return <div className="finder">
    <div className="finder-head">
      <span className="eyebrow">Coil finder</span>
      <h2 id="finder-title">Find coils that fit, in one tap.</h2>
      <p>Pick your device to see only the coils made for it.</p>
    </div>
    <div ref={pills} className={`finder-pills ${moving ? (move.forward ? "is-moving-forward" : "is-moving-back") : ""}`} role="group" aria-label="Choose your device">
      <span className="finder-highlight" />
      {devices.map((item, index) => <button key={item.id} className={index === move.active ? "is-current" : ""} aria-pressed={index === move.active} onClick={() => choose(index)}>{item.name}</button>)}
    </div>
    <div className="finder-results" key={device.id}>
      {fitting.length > 0 ? <ProductGrid items={fitting.slice(0, 4)} /> : <p className="finder-empty">No coils are listed for {device.name} yet.</p>}
    </div>
    <Link className="finder-all" href="/coils" onClick={() => setFit(device.id)}>See every coil for {device.name} <i aria-hidden="true">→</i></Link>
  </div>;
}
