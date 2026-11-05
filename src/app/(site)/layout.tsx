import type { ReactNode } from "react";
import { AgeGate } from "../age-gate";
import { ArtDefs } from "../art";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <AgeGate><ArtDefs />{children}</AgeGate>;
}
