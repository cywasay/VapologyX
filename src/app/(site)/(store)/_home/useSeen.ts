"use client";

import { useEffect, useRef, useState } from "react";
import { useAgeVerified } from "@/components/age-gate";

// True once the element has scrolled into view after the age check. Each section uses it to start its own entrance.
export function useSeen<T extends HTMLElement>(threshold = 0.3) {
  const verified = useAgeVerified();
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !verified || seen) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setSeen(true); }, { threshold });
    observer.observe(node);
    return () => observer.disconnect();
  }, [verified, seen, threshold]);

  return [ref, seen] as const;
}
