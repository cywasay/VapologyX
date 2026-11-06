"use client";

import { useEffect, useState } from "react";

// On the home page the header shrinks into a floating pill once the hero scrolls away.
export function useFloatingHeader(enabled: boolean) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const onScroll = () => {
      frame ||= requestAnimationFrame(() => { frame = 0; setScrolled(window.scrollY > 140); });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return enabled && scrolled;
}
