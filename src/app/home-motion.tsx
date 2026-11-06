"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type FocusEvent, type ReactNode } from "react";
import { useAgeVerified } from "./age-gate";
import { BottleArt, CoilArt, DeviceArt, DisposableArt, ProductArt } from "./art";
import { LIME, productHref, type Category, type Product } from "./products";
import { ProductCard } from "./product-lists";
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

// True once the element has scrolled into view after the age check. Each section uses it to start its own entrance.
function useSeen<T extends HTMLElement>(threshold = 0.3) {
  const verified = useAgeVerified();
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !verified || seen) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setSeen(true); }, { threshold });
    observer.observe(node);
    return () => observer.disconnect();
  }, [verified, seen, threshold]);

  return [ref, seen] as const;
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
  const [held, setHeld] = useState(false);
  const running = verified && !held;
  const stage = STAGES[move.active];

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setMove(current => moveTo(current, (current.active + 1) % STAGES.length)), STAGE_TIME);
    return () => clearTimeout(timer);
  }, [running, move.active]);

  // The shape runs on its own and the pointer never stops it. Only a keyboard user moving through the buttons holds it still.
  const hold = (event: FocusEvent<HTMLDivElement>) => { if (event.target.matches(":focus-visible")) setHeld(true); };
  const release = (event: FocusEvent<HTMLDivElement>) => { if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false); };

  return <div className={`stage ${move.forward ? "is-moving-forward" : "is-moving-back"}`} data-shape={move.active} style={{ "--active": move.active } as CSSProperties} onFocus={hold} onBlur={release}>
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
    <Link href={stage.href} className="stage-link"><b key={stage.category}>{counts[stage.category]} {stage.name.toLowerCase()}</b><span>Shop now <i aria-hidden="true">→</i></span></Link>
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

const COILS_SHOWN = 2;
const SWAP_TIME = 440;

// Pick a device and its coils slide out from underneath the device tile, like drawers.
// Changing device pulls the old coils back in first, then deals the new ones.
export function CoilFinder({ devices, coils }: { devices: Product[]; coils: Record<string, Product[]> }) {
  const { setFit } = useStore();
  const [ref, seen] = useSeen<HTMLDivElement>();
  const [selected, setSelected] = useState(0);
  const [shown, setShown] = useState(0);
  const [round, setRound] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const device = devices[shown];
  const fitting = (coils[device.id] ?? []).slice(0, COILS_SHOWN);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => {
      setShown(selected);
      setRound(current => current + 1);
      setLeaving(false);
    }, SWAP_TIME);
    return () => clearTimeout(timer);
  }, [leaving, selected]);

  function choose(index: number) {
    if (index === selected) return;
    setSelected(index);
    setLeaving(true);
  }

  return <div ref={ref} className="finder">
    <div className="finder-side">
      <div className="finder-head">
        <span className="eyebrow">Coil finder</span>
        <h2 id="finder-title">Find coils that fit, in one tap.</h2>
        <p>Pick your device to see only the coils made for it.</p>
      </div>
      <div className="finder-list" role="group" aria-label="Choose your device">
        {devices.map((item, index) => {
          const count = coils[item.id]?.length ?? 0;
          return <button key={item.id} className={index === selected ? "is-current" : ""} aria-pressed={index === selected} onClick={() => choose(index)}>
            <i aria-hidden="true" />
            <span>{item.name}</span>
            <em>{count ? `${count} ${count === 1 ? "coil" : "coils"}` : "No coils yet"}</em>
          </button>;
        })}
      </div>
    </div>
    <div className="finder-main">
      <p className="sr-only" role="status">{leaving ? "" : `Showing coils for ${device.name}`}</p>
      <div className={`finder-track ${seen ? "is-seen" : ""} ${leaving ? "is-leaving" : ""}`}>
        <Link href={productHref(device)} className="finder-device" aria-label={`View ${device.name}`}>
          <div className="finder-device-inner" key={`${device.id}-${round}`}>
            <span className="finder-device-tag">Your device</span>
            <span className="finder-device-art"><ProductArt item={device} sizes="260px" /></span>
            <strong>{device.name}</strong>
            <em>View device <i aria-hidden="true">→</i></em>
          </div>
        </Link>
        {fitting.map((coil, index) => <ProductCard key={`${device.id}-${round}-${coil.id}`} item={coil} meta={`Fits ${device.name}`} style={{ "--k": index + 1 } as CSSProperties} />)}
        {fitting.length === 0 && <p key={`${device.id}-${round}`} className="finder-empty">No coils are listed for {device.name} yet.</p>}
      </div>
      <Link className="finder-all" href="/coils" onClick={() => setFit(device.id)}>See every coil for {device.name} <i aria-hidden="true">→</i></Link>
    </div>
  </div>;
}

// The store visit block plays its own entrance once, when it scrolls into view.
export function VisitPanel({ children }: { children: ReactNode }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  return <div ref={ref} className={`home-visit-panel ${seen ? "is-seen" : ""}`}>{children}</div>;
}
