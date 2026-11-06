import type { ReactNode } from "react";
import { AgeGate } from "@/components/age-gate";
import { ArtDefs } from "@/components/art";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <AgeGate><ArtDefs />{children}</AgeGate>;
}
