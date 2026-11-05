"use client";

import { useState } from "react";

export function Ticker() {
  const [paused, setPaused] = useState(false);
  return <div className={`ticker ${paused ? "is-paused" : ""}`}>
    <div className="ticker-track" aria-hidden="true">
      {Array.from({ length: 36 }, (_, index) => <span key={index}>{["Every device", "Every coil", "Every flavor"][index % 3]}<i>✕</i></span>)}
    </div>
    <button className="ticker-toggle" onClick={() => setPaused(!paused)} aria-label={paused ? "Play scrolling text" : "Pause scrolling text"}>
      <svg viewBox="0 0 14 14" aria-hidden="true">{paused ? <path d="M3 1.5v11l9-5.5Z" /> : <path d="M3 1.5h3v11H3ZM8 1.5h3v11H8Z" />}</svg>
    </button>
  </div>;
}
