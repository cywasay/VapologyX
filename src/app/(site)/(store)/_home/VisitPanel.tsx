"use client";

import type { ReactNode } from "react";
import { useSeen } from "./useSeen";

// The store visit block plays its own entrance once, when it scrolls into view.
export function VisitPanel({ children }: { children: ReactNode }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  return <div ref={ref} className={`home-visit-panel ${seen ? "is-seen" : ""}`}>{children}</div>;
}
