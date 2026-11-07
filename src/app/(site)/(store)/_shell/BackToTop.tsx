"use client";

import { phoneMedia } from "@/lib/phone-layout";

export function BackToTop() {
  return <button className="footer-up" onClick={() => {
    const instant = phoneMedia().matches && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: instant ? "instant" : "smooth" });
  }}>Back to top <i aria-hidden="true">↑</i></button>;
}
