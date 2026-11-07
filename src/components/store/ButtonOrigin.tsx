"use client";

import { useEffect } from "react";

// Tells each button where the pointer came in and where it left, so its hover color can bloom out from that spot.
// One listener on the whole page does it for every button.
export function ButtonOrigin() {
  useEffect(() => {
    const mark = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const button = (event.target as Element | null)?.closest<HTMLElement>(".button, .cart-button");
      if (!button) return;
      const box = button.getBoundingClientRect();
      button.style.setProperty("--bx", `${event.clientX - box.left}px`);
      button.style.setProperty("--by", `${event.clientY - box.top}px`);
    };
    document.addEventListener("pointerover", mark);
    document.addEventListener("pointerout", mark);
    return () => {
      document.removeEventListener("pointerover", mark);
      document.removeEventListener("pointerout", mark);
    };
  }, []);
  return null;
}
