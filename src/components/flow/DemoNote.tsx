import type { ReactNode } from "react";

// Says out loud that orders are not real yet. Remove it once the back end takes orders.
export function DemoNote({ children }: { children: ReactNode }) {
  return <p className="flow-demo"><b>Demo</b><span>{children}</span></p>;
}
