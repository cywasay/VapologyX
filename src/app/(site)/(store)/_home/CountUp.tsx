"use client";

import { useEffect, useState } from "react";
import { useHomePhase } from "./HomeMotion";

// A number that counts up from zero during the home intro.
export function CountUp({ value }: { value: number }) {
  const phase = useHomePhase();
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (phase !== "intro") return;
    let start: number | undefined;
    let frame = requestAnimationFrame(function tick(now) {
      start ??= now + 900;
      const progress = Math.min(1, Math.max(0, (now - start) / 1300));
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [phase, value]);

  return <>{shown}</>;
}
