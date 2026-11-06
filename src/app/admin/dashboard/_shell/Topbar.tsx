import Link from "next/link";
import { Icon } from "../../_shared/Icon";

export function Topbar({ drawerOpen, onOpenMenu }: { drawerOpen: boolean; onOpenMenu: () => void }) {
  return <div className="admin-topbar">
    <button className="admin-menu" aria-label="Open menu" aria-expanded={drawerOpen} onClick={onOpenMenu}><Icon name={drawerOpen ? "close" : "menu"} /></button>
    <Link href="/" className="button button-black"><Icon name="store" />View store</Link>
  </div>;
}
