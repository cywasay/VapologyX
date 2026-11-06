"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { Avatar } from "../../_shared/Avatar";
import { useAccount } from "../../_shared/account";
import { Icon } from "../../_shared/Icon";
import { currentIndex, navItems } from "./navItems";

// The page links. A lime highlight slides to the current one, leading with whichever edge moves first.
export function SidebarNav({ minimized, onNavigate }: { minimized: boolean; onNavigate: () => void }) {
  const index = currentIndex(usePathname());
  const { account } = useAccount();
  const [shown, setShown] = useState({ index, direction: "down" });
  if (shown.index !== index) setShown({ index, direction: index < shown.index ? "up" : "down" });

  return <nav aria-label="Admin" className={`admin-nav is-moving-${shown.direction}`} style={{ "--active": index, "--count": navItems.length } as CSSProperties}>
    <span className="admin-highlight" aria-hidden="true" />
    {navItems.map((item, position) => <Link key={item.href} href={item.href} title={minimized ? item.name : undefined} className={position === index ? "is-current" : ""} aria-current={position === index ? "page" : undefined} onClick={onNavigate}>
      {item.name === "Settings" && account?.avatarUrl ? <span className="admin-avatar-slot"><Avatar account={account} size={32} /></span> : <Icon name={item.icon} />}
      <span className="admin-label">{item.name}</span>
    </Link>)}
  </nav>;
}
