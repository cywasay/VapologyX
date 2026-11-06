import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./counter.css";

export const metadata: Metadata = { title: "Counter" };

// Counter mode has its own full-screen frame: no sidebar, built to stay open all day at the till.
export default function CounterLayout({ children }: { children: ReactNode }) {
  return <div className="ct">{children}</div>;
}
