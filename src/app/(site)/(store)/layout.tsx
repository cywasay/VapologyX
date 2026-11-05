import type { ReactNode } from "react";
import { StoreShell } from "../../store-shell";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
