import type { Spec } from "@/lib/products";

// The first few specs shown as big numbers.
export function DetailHighlights({ specs }: { specs: Spec[] }) {
  if (specs.length === 0) return null;
  return <section className="shell detail-highlights" aria-label="Highlights">
    {specs.map(spec => <div key={spec.label} className="tile"><strong>{spec.value}</strong><span>{spec.label}</span></div>)}
  </section>;
}
