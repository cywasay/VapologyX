import type { ReactNode } from "react";

// The dark banner at the top of a page: a small label, the title and a line of text, with an optional drawing.
export function PageHead({ eyebrow, title, text, art, children }: { eyebrow: string; title: string; text: string; art?: ReactNode; children?: ReactNode }) {
  return <section className="shell page-head">
    <div className={`tile page-head-copy ${art ? "" : "is-wide"}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
      {children}
    </div>
    {art && <div className="tile page-head-art" aria-hidden="true">{art}</div>}
  </section>;
}
