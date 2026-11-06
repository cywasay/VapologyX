"use client";

export function BackToTop() {
  return <button className="footer-up" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top <i aria-hidden="true">↑</i></button>;
}
