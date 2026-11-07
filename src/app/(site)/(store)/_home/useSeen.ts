"use client";

import { useEffect, useRef, useState } from "react";
import { useAgeVerified } from "@/components/age-gate";
import { usePhoneLayout } from "@/lib/phone-layout";

// True once the element has scrolled into view after the age check. Each section uses it to start its own entrance.
export function useSeen<T extends HTMLElement>(threshold = 0.3) {
  const verified = useAgeVerified();
  const phone = usePhoneLayout();
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (phone || !node || !verified || seen) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setSeen(true); }, { threshold });
    observer.observe(node);
    return () => observer.disconnect();
  }, [phone, verified, seen, threshold]);

  return [ref, seen, phone] as const;
}
