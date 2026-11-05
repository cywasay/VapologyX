import type { Metadata } from "next";
import { MINIMUM_AGE } from "../products";

export const metadata: Metadata = { title: "Access denied" };

export default function Denied() {
  return <main className="denied">
    <div className="denied-panel">
      <span className="age-badge">{MINIMUM_AGE}+</span>
      <h1>Access denied</h1>
      <p>You must be {MINIMUM_AGE} or older to enter this site.</p>
    </div>
  </main>;
}
