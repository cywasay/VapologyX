"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FocusEvent } from "react";
import { useAgeVerified } from "@/components/age-gate";
import { BottleArt, CoilArt, DeviceArt, DisposableArt } from "@/components/art";
import { LIME, type Category } from "@/lib/products";

export type ShelfCounts = Record<Category, number>;
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
