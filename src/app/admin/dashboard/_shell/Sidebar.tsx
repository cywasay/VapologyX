import Link from "next/link";
import { Icon } from "../../_shared/Icon";
import { SidebarNav } from "./SidebarNav";

export function Sidebar({ minimized, onToggle, onNavigate, onLogout }: { minimized: boolean; onToggle: () => void; onNavigate: () => void; onLogout: () => void }) {
  return <aside className="admin-side">
    <button className="admin-collapse" aria-expanded={!minimized} aria-label={minimized ? "Expand sidebar" : "Minimize sidebar"} onClick={onToggle}><Icon name="chevron" /></button>
    <Link href="/" className="admin-brand" aria-label="VapologyX store"><span className="admin-logo">X</span><span className="admin-label">VapologyX</span></Link>
    <SidebarNav minimized={minimized} onNavigate={onNavigate} />
    <div className="admin-nav admin-nav-bottom">
      <Link href="/admin/counter" title={minimized ? "Counter" : undefined}><Icon name="orders" /><span className="admin-label">Counter</span></Link>
      <Link href="/" title={minimized ? "View store" : undefined}><Icon name="store" /><span className="admin-label">View store</span></Link>
      <button className="admin-logout" title={minimized ? "Log out" : undefined} onClick={onLogout}><Icon name="logout" /><span className="admin-label">Log out</span></button>
    </div>
  </aside>;
}
