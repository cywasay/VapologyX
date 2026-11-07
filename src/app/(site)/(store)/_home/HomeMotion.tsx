"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAgeVerified } from "@/components/age-gate";
import { usePhoneLayout } from "@/lib/phone-layout";

type Phase = "waiting" | "intro" | "settled";

const PhaseContext = createContext<Phase>("settled");
const INTRO_TIME = 2800;

export const useHomePhase = () => useContext(PhaseContext);

// Plays the home intro once, after the age check, and not again when the visitor comes back to the page.
export function HomeMotion({ children }: { children: ReactNode }) {
  const verified = useAgeVerified();
  const phone = usePhoneLayout();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (phone || !verified || settled) return;
    const timer = setTimeout(() => setSettled(true), INTRO_TIME);
    return () => clearTimeout(timer);
  }, [phone, verified, settled]);

  const phase: Phase = phone || settled ? "settled" : verified ? "intro" : "waiting";
  return <PhaseContext value={phase}><div className={`home motion is-${phase}`}>{children}</div></PhaseContext>;
}
