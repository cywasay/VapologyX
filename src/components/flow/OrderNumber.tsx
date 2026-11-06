"use client";

import { useEffect, useState } from "react";

// The order number with a button to copy it.
export function OrderNumber({ number }: { number: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
    } catch {}
  }

  return <div className="order-number">
    <span>{number}</span>
    <button type="button" onClick={copy} aria-label={`Copy order number ${number}`}>{copied ? "Copied" : "Copy"}</button>
  </div>;
}
