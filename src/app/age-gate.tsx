"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Wordmark } from "./art";
import { MINIMUM_AGE } from "./products";

const STORAGE_KEY = "age-gate";
type Status = "pending" | "unverified" | "verified" | "denied";

// "Yes" is remembered in this browser. "No" locks this tab until it is closed.
let remembered: Status | null = null;
const listeners = new Set<() => void>();

function readStatus(): Status {
  if (remembered) return remembered;
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === "denied") return "denied";
    return localStorage.getItem(STORAGE_KEY) === "verified" ? "verified" : "unverified";
  } catch {
    return "unverified";
  }
}

function writeStatus(status: "verified" | "denied") {
  remembered = status;
  try {
    if (status === "verified") localStorage.setItem(STORAGE_KEY, status);
    else sessionStorage.setItem(STORAGE_KEY, status);
  } catch {}
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// "pending" on the server keeps the store covered until the browser has checked.
const useStatus = () => useSyncExternalStore(subscribe, readStatus, () => "pending" as Status);

// True once the visitor is through the gate, so intro animations can wait for them.
export const useAgeVerified = () => useStatus() === "verified";

export function AgeGate({ children }: { children: ReactNode }) {
  const status = useStatus();

  useEffect(() => {
    if (status === "denied") window.location.replace("/denied");
  }, [status]);

  const locked = status !== "verified";
  return <>
    <div inert={locked}>{children}</div>
    {locked && <div className={`age-gate ${status === "unverified" ? "" : "is-covered"}`}>
      {status === "unverified" && <div className="age-panel" role="dialog" aria-modal="true" aria-labelledby="age-title" aria-describedby="age-description">
        <div className="age-top"><Wordmark /><span className="age-badge">{MINIMUM_AGE}+</span></div>
        <h2 id="age-title">Are you over {MINIMUM_AGE}?</h2>
        <p id="age-description">You must be {MINIMUM_AGE} or older to enter this site.</p>
        <div className="age-actions">
          <button className="button button-primary" onClick={() => writeStatus("verified")} autoFocus>Yes, I&apos;m over {MINIMUM_AGE}</button>
          <button className="button button-outline" onClick={() => writeStatus("denied")}>No</button>
        </div>
      </div>}
    </div>}
  </>;
}
