"use client";

import { useEffect, useState } from "react";

// A figure that counts up to its value when it appears. Screen readers get the final number at once, never the count.
export function AnimatedNumber({ value, format = String, duration = 900 }: { value: number; format?: (value: number) => string; duration?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>
    <span aria-hidden="true">{format(shown)}</span>
    <span className="sr-only">{format(value)}</span>
  </>;
}
