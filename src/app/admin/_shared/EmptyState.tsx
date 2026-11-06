import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return <div className="admin-empty"><span className="admin-chip"><Icon name={icon} /></span><strong>{title}</strong><p>{children}</p></div>;
}
