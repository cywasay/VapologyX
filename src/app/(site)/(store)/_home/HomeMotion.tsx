"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAgeVerified } from "@/components/age-gate";

type Phase = "waiting" | "intro" | "settled";

const PhaseContext = createContext<Phase>("settled");
const INTRO_TIME = 2800;

export const useHomePhase = () => useContext(PhaseContext);

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
