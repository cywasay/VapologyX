import Link from "next/link";
import { Icon } from "../../_shared/Icon";
import { NotificationBell } from "./NotificationBell";

export function Topbar({ drawerOpen, onOpenMenu }: { drawerOpen: boolean; onOpenMenu: () => void }) {
  return <div className="admin-topbar">
    <button className="admin-menu" aria-label="Open menu" aria-expanded={drawerOpen} onClick={onOpenMenu}><Icon name={drawerOpen ? "close" : "menu"} /></button>
    <div className="admin-topbar-actions"><NotificationBell /><Link href="/" className="button button-black"><Icon name="store" />View store</Link></div>
  </div>;
}
