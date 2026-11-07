"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

export function PhoneBottomBar({ label, children }: { label: string; children: ReactNode }) {
  const bar = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const frame = bar.current?.closest<HTMLElement>(".store-frame");
    if (!frame) return;
    // Cached routes keep their DOM but disconnect effects while hidden.
    frame.dataset.phoneBottomBar = "";
    return () => { delete frame.dataset.phoneBottomBar; };
  }, []);

  return <div ref={bar} className="phone-only phone-bottom-bar" role="group" aria-label={label}>{children}</div>;
}
