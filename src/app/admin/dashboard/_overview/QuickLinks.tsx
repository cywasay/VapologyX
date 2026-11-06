import Link from "next/link";
import { Icon } from "../../_shared/Icon";
import { DASHBOARD } from "../_shell/navItems";

export function QuickLinks() {
  return <div className="admin-mini-row">
    <Link className="admin-mini" href={`${DASHBOARD}/customers`}><span className="admin-chip"><Icon name="customers" /></span>Customers</Link>
    <Link className="admin-mini" href={`${DASHBOARD}/messages`}><span className="admin-chip"><Icon name="messages" /></span>Messages</Link>
  </div>;
}
