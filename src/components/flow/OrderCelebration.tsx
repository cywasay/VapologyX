"use client";

import { useEffect, useState, type CSSProperties } from "react";

const PIECES = 12;
const COLORS = ["var(--accent)", "var(--ink)", "var(--surface)"];

// A check mark that draws itself, and a short burst of confetti the first time this order is seen on this device.
// It is twelve small shapes moving with transform and opacity for under a second, so it costs a phone almost nothing.
export function OrderCelebration({ number }: { number: string }) {
  const key = `vx-celebrated-${number}`;
  // Only read here; the "seen" mark is saved after the first showing, so a re-render can never cancel the burst.
  const [burst] = useState(() => { try { return !sessionStorage.getItem(key); } catch { return false; } });
  useEffect(() => { try { sessionStorage.setItem(key, "1"); } catch {} }, [key]);
  return <div className="order-celebrate keep-motion" aria-hidden="true">
    <svg viewBox="0 0 52 52"><circle className="order-check-ring" cx="26" cy="26" r="23" /><path className="order-check-tick" d="m15 27 8 8 15-17" /></svg>
    {burst && Array.from({ length: PIECES }, (_, index) => {
      const angle = (index / PIECES) * Math.PI * 2;
      const reach = 54 + (index % 3) * 14;
      return <i key={index} style={{ "--x": `${Math.round(Math.cos(angle) * reach)}px`, "--y": `${Math.round(Math.sin(angle) * reach)}px`, "--c": COLORS[index % COLORS.length], "--r": `${(index % 4) * 70}deg` } as CSSProperties} />;
    })}
  </div>;
}
